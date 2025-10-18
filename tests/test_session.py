from dataclasses import dataclass

import pytest

from livekit_client.config import Config
from livekit_client.session import LiveKitSession


class DummyTokenService:
    def __init__(self):
        self.calls = []

    def fetch_token(self, room, identity, force=False):  # pragma: no cover - not used in tests
        self.calls.append((room, identity, force))
        return "token"


class DummyTrack:
    def __init__(self):
        self.muted = False

    def mute(self):
        self.muted = True

    def unmute(self):
        self.muted = False


class FakeRoom:
    def __init__(self):
        self.remote_participants = {}
        self._handlers = {}
        self.name = "test"
        self._connected = True

    def on(self, event, callback):
        self._handlers[event] = callback

    def isconnected(self):
        return self._connected

    def disconnect(self):  # pragma: no cover - not used
        self._connected = False


@pytest.fixture(autouse=True)
def fake_room(monkeypatch):
    monkeypatch.setattr("livekit_client.session.rtc.Room", FakeRoom)


def test_mute_unmute(monkeypatch):
    config = Config(livekit_url="wss://", room_name="room", participant_identity="id")
    session = LiveKitSession(config, DummyTokenService())
    session._local_audio_track = DummyTrack()

    session.mute()
    assert session.status()["muted"] is True
    assert session._local_audio_track.muted is True

    session.unmute()
    assert session.status()["muted"] is False
    assert session._local_audio_track.muted is False
