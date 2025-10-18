"""Audio device enumeration and selection."""
from __future__ import annotations

from dataclasses import dataclass
from typing import List, Optional, Sequence, Tuple

try:  # pragma: no cover - import guard for optional dependency
    import sounddevice as sd
except Exception:  # pragma: no cover
    sd = None  # type: ignore

from .logging_config import get_logger

_LOG = get_logger(__name__)


class AudioDeviceError(RuntimeError):
    pass


@dataclass
class AudioDevice:
    index: int
    name: str
    max_input_channels: int
    max_output_channels: int
    default_samplerate: float


def _ensure_sd() -> None:
    if sd is None:
        raise AudioDeviceError("sounddevice library is not available. Install python-sounddevice")


def list_devices() -> List[AudioDevice]:
    _ensure_sd()
    devices = []
    for idx, info in enumerate(sd.query_devices()):
        devices.append(
            AudioDevice(
                index=idx,
                name=info.get("name", f"Device {idx}"),
                max_input_channels=int(info.get("max_input_channels", 0)),
                max_output_channels=int(info.get("max_output_channels", 0)),
                default_samplerate=float(info.get("default_samplerate", 48_000)),
            )
        )
    return devices


def _default_device_pair() -> Tuple[Optional[int], Optional[int]]:
    if sd is None:  # pragma: no cover - validated in _ensure_sd
        return None, None
    defaults = sd.default.device
    if isinstance(defaults, Sequence) and len(defaults) == 2:
        return defaults[0], defaults[1]
    return None, None


def select_device(preferred: Optional[str], *, kind: str) -> Optional[str]:
    """Return a device name matching ``preferred`` or fall back to system default."""

    _ensure_sd()
    preferred = (preferred or "").strip()
    devices = list_devices()
    if preferred:
        for device in devices:
            if preferred.lower() in device.name.lower():
                _LOG.info("Using requested %s device: %s", kind, device.name)
                return device.name
        _LOG.warning("Requested %s device '%s' not found; falling back to default", kind, preferred)

    default_input, default_output = _default_device_pair()
    if kind == "input" and default_input is not None:
        return devices[default_input].name if default_input < len(devices) else devices[0].name
    if kind == "output" and default_output is not None:
        return devices[default_output].name if default_output < len(devices) else devices[0].name

    # Choose first matching device with relevant channel support
    for device in devices:
        if kind == "input" and device.max_input_channels > 0:
            _LOG.info("Fallback to first input device: %s", device.name)
            return device.name
        if kind == "output" and device.max_output_channels > 0:
            _LOG.info("Fallback to first output device: %s", device.name)
            return device.name

    _LOG.error("No suitable %s device found", kind)
    return None


__all__ = ["AudioDevice", "AudioDeviceError", "list_devices", "select_device"]
