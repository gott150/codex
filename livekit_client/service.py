"""Service runner for the LiveKit audio client."""
from __future__ import annotations

import asyncio
import contextlib
import os
import signal
from typing import Dict, Optional

from .audio_devices import AudioDeviceError, list_devices
from .config import Config
from .ipc import IPCClient, IPCError, IPCServer
from .logging_config import get_logger
from .session import LiveKitSession
from .token_service import TokenService, TokenServiceError

_LOG = get_logger(__name__)


def _pid_alive(pid: int) -> bool:
    try:
        os.kill(pid, 0)
    except ProcessLookupError:
        return False
    except PermissionError:
        return True
    else:
        return True


class ServiceAlreadyRunning(RuntimeError):
    pass


class LiveKitService:
    def __init__(self, config: Config, room: Optional[str] = None, identity: Optional[str] = None) -> None:
        self.config = config
        self.room = room or config.room_name
        self.identity = identity or config.participant_identity
        self.token_service = TokenService(config.token_server_url)
        self.session = LiveKitSession(config, self.token_service)
        self.ipc_server = IPCServer(config.socket_path, self._handle_command)
        self._stop_event = asyncio.Event()
        self._loop: Optional[asyncio.AbstractEventLoop] = None

    async def run(self) -> None:
        self._loop = asyncio.get_running_loop()
        self._write_pid()
        self._install_signal_handlers()
        try:
            await self.ipc_server.start()
            await self.session.connect(self.room, self.identity)
            _LOG.info("LiveKit service is ready for IPC commands")
            await self._stop_event.wait()
        finally:
            await self._shutdown()
            self._cleanup_pid()

    async def stop(self) -> None:
        if self._stop_event.is_set():
            return
        self._stop_event.set()

    async def _shutdown(self) -> None:
        await self.session.disconnect()
        self.ipc_server.stop()

    def _install_signal_handlers(self) -> None:
        if self._loop is None:
            return
        for sig in (signal.SIGINT, signal.SIGTERM):
            try:
                self._loop.add_signal_handler(sig, lambda s=sig: asyncio.create_task(self.stop()))
            except NotImplementedError:  # pragma: no cover - Windows
                signal.signal(sig, lambda *_: asyncio.create_task(self.stop()))

    def _write_pid(self) -> None:
        pid_file = self.config.pid_file
        if pid_file.exists():
            try:
                existing = int(pid_file.read_text().strip())
            except ValueError:
                existing = None
            if existing and _pid_alive(existing):
                raise ServiceAlreadyRunning(f"Service already running with PID {existing}")
            with contextlib.suppress(Exception):
                pid_file.unlink()
        pid_file.write_text(str(os.getpid()))
        _LOG.info("Wrote PID file to %s", pid_file)

    def _cleanup_pid(self) -> None:
        with contextlib.suppress(Exception):
            if self.config.pid_file.exists():
                self.config.pid_file.unlink()

    async def _handle_command(self, message: Dict[str, object]) -> Dict[str, object]:
        command = message.get("command") if isinstance(message, dict) else None
        _LOG.debug("Received IPC command: %s", command)
        if command == "mute":
            self.session.mute()
            return {"status": "ok", "muted": True}
        if command == "unmute":
            self.session.unmute()
            return {"status": "ok", "muted": False}
        if command == "status":
            return {"status": "ok", **self.session.status()}
        if command == "shutdown":
            await self.stop()
            return {"status": "ok", "message": "shutting down"}
        if command == "devices":
            try:
                devices = [device.__dict__ for device in list_devices()]
            except AudioDeviceError as exc:
                return {"status": "error", "error": str(exc)}
            return {"status": "ok", "devices": devices}
        if command == "token-test":
            room_name = message.get("room") or self.room
            identity = message.get("identity") or self.identity
            try:
                token = self.token_service.fetch_token(str(room_name), str(identity), force=True)
            except TokenServiceError as exc:
                return {"status": "error", "error": str(exc)}
            return {"status": "ok", "token": token}
        return {"status": "error", "error": f"unknown command: {command}"}


def send_ipc_command(config: Config, command: str, payload: Optional[Dict[str, object]] = None) -> Dict[str, object]:
    client = IPCClient(config.socket_path)
    return client.request_sync(command, payload)


__all__ = ["LiveKitService", "ServiceAlreadyRunning", "send_ipc_command"]
