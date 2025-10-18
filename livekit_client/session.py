"""LiveKit session management."""
from __future__ import annotations

import asyncio
import contextlib
from dataclasses import dataclass
from typing import Dict, Optional
import queue

try:  # pragma: no cover - optional dependency guard
    import sounddevice as sd
except Exception:  # pragma: no cover
    sd = None  # type: ignore

from livekit import rtc

from .audio_devices import select_device
from .config import Config
from .logging_config import get_logger
from .token_service import TokenService

_LOG = get_logger(__name__)


class AudioRuntimeError(RuntimeError):
    pass


def _ensure_sounddevice() -> None:
    if sd is None:
        raise AudioRuntimeError("sounddevice is required for audio streaming")


@dataclass
class _AudioCapture:
    sample_rate: int
    channels: int
    device: Optional[str]
    block_duration: float = 0.02

    def __post_init__(self) -> None:
        _ensure_sounddevice()
        blocksize = max(1, int(self.sample_rate * self.block_duration))
        self._queue: "queue.Queue[bytes]" = queue.Queue(maxsize=25)
        self._stream = sd.RawInputStream(
            samplerate=self.sample_rate,
            channels=self.channels,
            dtype="int16",
            blocksize=blocksize,
            device=self.device,
            callback=self._callback,
        )

    def _callback(self, indata, frames, time, status) -> None:  # pragma: no cover - callback
        if status:
            _LOG.warning("Input stream status: %s", status)
        data = bytes(indata)
        try:
            self._queue.put_nowait(data)
        except queue.Full:
            _LOG.debug("Dropping audio input frame due to full queue")

    def start(self) -> None:
        self._stream.start()

    def stop(self) -> None:
        with contextlib.suppress(Exception):
            self._stream.stop()
        with contextlib.suppress(Exception):
            self._stream.close()

    async def read(self) -> bytes:
        return await asyncio.to_thread(self._queue.get)


@dataclass
class _AudioPlayback:
    sample_rate: int
    channels: int
    device: Optional[str]
    block_duration: float = 0.02

    def __post_init__(self) -> None:
        _ensure_sounddevice()
        blocksize = max(1, int(self.sample_rate * self.block_duration))
        self._queue: "queue.Queue[bytes]" = queue.Queue(maxsize=50)
        self._stream = sd.RawOutputStream(
            samplerate=self.sample_rate,
            channels=self.channels,
            dtype="int16",
            blocksize=blocksize,
            device=self.device,
            callback=self._callback,
        )

    def _callback(self, outdata, frames, time, status) -> None:  # pragma: no cover - callback
        if status:
            _LOG.warning("Output stream status: %s", status)
        try:
            chunk = self._queue.get_nowait()
        except queue.Empty:
            outdata[:] = b"\x00" * len(outdata)
            return
        if len(chunk) < len(outdata):
            outdata[: len(chunk)] = chunk
            outdata[len(chunk) :] = b"\x00" * (len(outdata) - len(chunk))
        else:
            outdata[:] = chunk[: len(outdata)]

    def start(self) -> None:
        self._stream.start()

    async def play(self, data: bytes) -> None:
        try:
            self._queue.put_nowait(data)
        except queue.Full:
            _LOG.debug("Dropping playback audio frame due to full queue")

    async def aclose(self) -> None:
        with contextlib.suppress(Exception):
            self._stream.stop()
        with contextlib.suppress(Exception):
            self._stream.close()


class LiveKitSession:
    """Manage a LiveKit session, including audio handling and reconnection."""

    def __init__(self, config: Config, token_service: TokenService) -> None:
        self.config = config
        self.token_service = token_service
        self._room = rtc.Room()
        self._loop: Optional[asyncio.AbstractEventLoop] = None
        self._local_audio_track: Optional[rtc.LocalAudioTrack] = None
        self._audio_source: Optional[rtc.AudioSource] = None
        self._capture: Optional[_AudioCapture] = None
        self._mic_task: Optional[asyncio.Task] = None
        self._playbacks: Dict[str, tuple[_AudioPlayback, asyncio.Task]] = {}
        self._connected = asyncio.Event()
        self._stopping = False
        self._muted = False
        self._connection_state: str = "disconnected"

        self._room.on("connected", self._on_connected)
        self._room.on("disconnected", self._on_disconnected)
        self._room.on("reconnecting", self._on_reconnecting)
        self._room.on("reconnected", self._on_reconnected)
        self._room.on("track_subscribed", self._on_track_subscribed)
        self._room.on("track_unsubscribed", self._on_track_unsubscribed)

    async def connect(self, room: Optional[str] = None, identity: Optional[str] = None) -> None:
        self._loop = asyncio.get_running_loop()
        room_name = room or self.config.room_name
        participant = identity or self.config.participant_identity
        if not room_name or not participant:
            raise ValueError("Room name and participant identity must be provided")

        _LOG.info("Fetching token for room %s", room_name)
        token = self.token_service.fetch_token(room_name, participant)
        self._connection_state = "connecting"
        await self._room.connect(self.config.livekit_url, token, auto_subscribe=True)
        await self._connected.wait()

    async def disconnect(self) -> None:
        self._stopping = True
        if self._mic_task:
            self._mic_task.cancel()
            with contextlib.suppress(asyncio.CancelledError):
                await self._mic_task
        if self._capture:
            self._capture.stop()
            self._capture = None
        for playback, task in list(self._playbacks.values()):
            task.cancel()
            with contextlib.suppress(asyncio.CancelledError):
                await task
            await playback.aclose()
        self._playbacks.clear()
        if self._room.isconnected():
            await self._room.disconnect()
        self._connection_state = "disconnected"

    def is_connected(self) -> bool:
        return self._room.isconnected()

    def mute(self) -> None:
        if self._local_audio_track:
            self._local_audio_track.mute()
            self._muted = True
            _LOG.info("Microphone muted")

    def unmute(self) -> None:
        if self._local_audio_track:
            self._local_audio_track.unmute()
            self._muted = False
            _LOG.info("Microphone unmuted")

    def status(self) -> Dict[str, object]:
        return {
            "connection_state": self._connection_state,
            "muted": self._muted,
            "remote_participants": len(self._room.remote_participants),
            "room": self._room.name,
        }

    # Room event handlers -------------------------------------------------

    def _on_connected(self) -> None:
        _LOG.info("Connected to LiveKit room")
        self._connection_state = "connected"
        asyncio.create_task(self._start_audio())
        self._connected.set()

    def _on_disconnected(self) -> None:
        _LOG.warning("Disconnected from LiveKit room")
        self._connection_state = "disconnected"
        if not self._stopping:
            asyncio.create_task(self._reconnect())

    def _on_reconnecting(self) -> None:
        _LOG.warning("LiveKit room reconnecting")
        self._connection_state = "reconnecting"

    def _on_reconnected(self) -> None:
        _LOG.info("Reconnected to LiveKit room")
        self._connection_state = "connected"
        asyncio.create_task(self._start_audio(republish=True))

    def _on_track_subscribed(self, track: rtc.Track, publication, participant) -> None:
        if isinstance(track, rtc.RemoteAudioTrack):
            asyncio.create_task(self._start_playback(track))

    def _on_track_unsubscribed(self, track: rtc.Track, publication, participant) -> None:
        if isinstance(track, rtc.RemoteAudioTrack):
            playback = self._playbacks.pop(track.sid, None)
            if playback:
                playback[1].cancel()
                asyncio.create_task(self._close_playback(playback[0], playback[1]))

    # Internal helpers -----------------------------------------------------

    async def _start_audio(self, *, republish: bool = False) -> None:
        if self._audio_source is None or republish:
            self._audio_source = rtc.AudioSource(
                sample_rate=self.config.audio_sample_rate,
                num_channels=self.config.audio_channels,
                loop=self._loop,
            )
            self._local_audio_track = rtc.LocalAudioTrack.create_audio_track("microphone", self._audio_source)
            await self._room.local_participant.publish_track(self._local_audio_track)
            if self._muted:
                self._local_audio_track.mute()
        if self._capture is None or republish:
            input_device = select_device(self.config.input_device, kind="input")
            self._capture = _AudioCapture(
                sample_rate=self.config.audio_sample_rate,
                channels=self.config.audio_channels,
                device=input_device,
            )
            self._capture.start()
        if self._mic_task is None or self._mic_task.done() or republish:
            if self._mic_task and not self._mic_task.done():
                self._mic_task.cancel()
                with contextlib.suppress(asyncio.CancelledError):
                    await self._mic_task
            self._mic_task = asyncio.create_task(self._microphone_loop())

    async def _microphone_loop(self) -> None:
        assert self._audio_source is not None
        assert self._capture is not None
        while not self._stopping:
            data = await self._capture.read()
            if not data:
                continue
            samples_per_channel = len(data) // 2 // self.config.audio_channels
            frame = rtc.AudioFrame(
                data,
                sample_rate=self.config.audio_sample_rate,
                num_channels=self.config.audio_channels,
                samples_per_channel=samples_per_channel,
            )
            try:
                await self._audio_source.capture_frame(frame)
            except Exception as exc:
                _LOG.error("Failed to capture audio frame: %s", exc)

    async def _start_playback(self, track: rtc.RemoteAudioTrack) -> None:
        output_device = select_device(self.config.output_device, kind="output")
        playback = _AudioPlayback(
            sample_rate=self.config.audio_sample_rate,
            channels=self.config.audio_channels,
            device=output_device,
        )
        playback.start()
        stream = rtc.AudioStream(track, sample_rate=self.config.audio_sample_rate, num_channels=self.config.audio_channels)

        async def _runner() -> None:
            async for event in stream:
                await playback.play(event.frame.data)

        task = asyncio.create_task(_runner())
        self._playbacks[track.sid] = (playback, task)

    async def _close_playback(self, playback: _AudioPlayback, task: asyncio.Task) -> None:
        with contextlib.suppress(asyncio.CancelledError):
            await task
        await playback.aclose()

    async def _reconnect(self) -> None:
        if self._stopping:
            return
        await asyncio.sleep(2)
        try:
            await self.connect()
        except Exception as exc:
            _LOG.error("Reconnection attempt failed: %s", exc)
            asyncio.create_task(self._reconnect())


__all__ = ["LiveKitSession", "AudioRuntimeError"]
