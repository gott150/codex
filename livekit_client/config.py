"""Configuration helpers for the LiveKit CLI service."""
from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path
from typing import Dict, Optional
import os

from dotenv import load_dotenv

DEFAULT_SOCKET_PATH = Path("/tmp/livekit_client.sock")
DEFAULT_PID_PATH = Path("/tmp/livekit_client.pid")
DEFAULT_TOKEN_URL = "http://localhost:5000/get_token"


@dataclass
class Config:
    """Container for runtime configuration."""

    livekit_url: str
    token_server_url: str = DEFAULT_TOKEN_URL
    room_name: Optional[str] = None
    participant_identity: Optional[str] = None
    audio_sample_rate: int = 48_000
    audio_channels: int = 1
    input_device: Optional[str] = None
    output_device: Optional[str] = None
    log_level: str = "INFO"
    socket_path: Path = field(default_factory=lambda: DEFAULT_SOCKET_PATH)
    pid_file: Path = field(default_factory=lambda: DEFAULT_PID_PATH)

    @property
    def is_ready(self) -> bool:
        """Return ``True`` when the minimum connection data is available."""

        return bool(self.livekit_url and self.room_name and self.participant_identity)


def _get_env_path(env_file: Optional[str]) -> Optional[Path]:
    if env_file:
        env_path = Path(env_file)
        if env_path.exists():
            return env_path
    default_env = Path(".env")
    if default_env.exists():
        return default_env
    return None


def load_config(overrides: Optional[Dict[str, str]] = None, env_file: Optional[str] = None) -> Config:
    """Load configuration from environment variables and optional overrides."""

    overrides = overrides or {}
    env_path = _get_env_path(env_file)
    if env_path is not None:
        load_dotenv(env_path)

    def _get(key: str, default: Optional[str] = None) -> Optional[str]:
        if key in overrides:
            return overrides[key]
        return os.getenv(key, default)

    livekit_url = _get("LIVEKIT_URL", "")
    token_url = _get("TOKEN_SERVER_URL", DEFAULT_TOKEN_URL)
    room_name = _get("ROOM_NAME")
    participant = _get("PARTICIPANT_IDENTITY")
    log_level = (_get("LOG_LEVEL", "INFO") or "INFO").upper()

    def _int_value(name: str, default: int) -> int:
        value = _get(name)
        if value is None:
            return default
        try:
            parsed = int(value)
        except ValueError:
            raise ValueError(f"Invalid integer value for {name}: {value}") from None
        return parsed

    audio_sample_rate = _int_value("AUDIO_SAMPLE_RATE", 48_000)
    audio_channels = _int_value("AUDIO_CHANNELS", 1)
    input_device = _get("INPUT_DEVICE")
    output_device = _get("OUTPUT_DEVICE")

    socket_path = Path(_get("IPC_SOCKET_PATH", str(DEFAULT_SOCKET_PATH)))
    pid_file = Path(_get("PID_FILE_PATH", str(DEFAULT_PID_PATH)))

    return Config(
        livekit_url=livekit_url,
        token_server_url=token_url,
        room_name=room_name,
        participant_identity=participant,
        audio_sample_rate=audio_sample_rate,
        audio_channels=audio_channels,
        input_device=input_device,
        output_device=output_device,
        log_level=log_level,
        socket_path=socket_path,
        pid_file=pid_file,
    )


__all__ = ["Config", "load_config", "DEFAULT_SOCKET_PATH", "DEFAULT_PID_PATH", "DEFAULT_TOKEN_URL"]
