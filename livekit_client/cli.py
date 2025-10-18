"""Command line interface for the LiveKit audio client."""
from __future__ import annotations

import argparse
import asyncio
import json
import sys
from typing import Dict, Optional

from .audio_devices import AudioDeviceError, list_devices
from .config import Config, load_config
from .logging_config import configure_logging, get_logger
from .ipc import IPCError
from .service import LiveKitService, ServiceAlreadyRunning, send_ipc_command
from .token_service import TokenService, TokenServiceError

_LOG = get_logger(__name__)


def _config_overrides_from_args(args: argparse.Namespace) -> Dict[str, str]:
    overrides: Dict[str, str] = {}
    if args.livekit_url:
        overrides["LIVEKIT_URL"] = args.livekit_url
    if args.token_server_url:
        overrides["TOKEN_SERVER_URL"] = args.token_server_url
    if args.room:
        overrides["ROOM_NAME"] = args.room
    if args.identity:
        overrides["PARTICIPANT_IDENTITY"] = args.identity
    if args.input_device:
        overrides["INPUT_DEVICE"] = args.input_device
    if args.output_device:
        overrides["OUTPUT_DEVICE"] = args.output_device
    if args.sample_rate:
        overrides["AUDIO_SAMPLE_RATE"] = str(args.sample_rate)
    if args.audio_channels:
        overrides["AUDIO_CHANNELS"] = str(args.audio_channels)
    if args.log_level:
        overrides["LOG_LEVEL"] = args.log_level
    return overrides


def _load_and_prepare_config(args: argparse.Namespace) -> Config:
    overrides = _config_overrides_from_args(args)
    config = load_config(overrides=overrides, env_file=args.env)
    configure_logging(config.log_level)
    if not config.livekit_url:
        raise SystemExit("LIVEKIT_URL must be provided via .env or CLI")
    return config


async def _run_service(config: Config, room: Optional[str], identity: Optional[str]) -> None:
    service = LiveKitService(config, room=room, identity=identity)
    try:
        await service.run()
    except ServiceAlreadyRunning as exc:
        raise SystemExit(str(exc)) from exc


def _send_command(config: Config, command: str, payload: Optional[Dict[str, object]] = None) -> Dict[str, object]:
    try:
        response = send_ipc_command(config, command, payload)
    except IPCError as exc:
        raise SystemExit(f"LiveKit service is not running ({exc}). Start it with the join command.") from exc
    if response.get("status") != "ok":
        error = response.get("error", "unknown error")
        raise SystemExit(f"Command failed: {error}")
    response = dict(response)
    response.pop("status", None)
    return response


def command_join(args: argparse.Namespace) -> None:
    config = _load_and_prepare_config(args)
    # Check whether service already running
    try:
        send_ipc_command(config, "status")
    except Exception:
        pass
    else:
        raise SystemExit("Service already running. Use status command for details.")

    try:
        asyncio.run(_run_service(config, args.room, args.identity))
    except KeyboardInterrupt:
        pass


def command_mute(args: argparse.Namespace) -> None:
    config = _load_and_prepare_config(args)
    response = _send_command(config, "mute")
    print("Muted" if response.get("muted") else "Mute command succeeded")


def command_unmute(args: argparse.Namespace) -> None:
    config = _load_and_prepare_config(args)
    response = _send_command(config, "unmute")
    print("Unmuted" if not response.get("muted") else "Unmute command succeeded")


def command_status(args: argparse.Namespace) -> None:
    config = _load_and_prepare_config(args)
    response = _send_command(config, "status")
    print(json.dumps(response, indent=2))


def command_devices(args: argparse.Namespace) -> None:
    config = _load_and_prepare_config(args)
    try:
        response = _send_command(config, "devices")
        devices = response.get("devices", [])
        print(json.dumps(devices, indent=2))
        return
    except SystemExit:
        if not args.local:
            raise
    try:
        devices = [device.__dict__ for device in list_devices()]
    except AudioDeviceError as exc:
        raise SystemExit(str(exc)) from exc
    print(json.dumps(devices, indent=2))


def command_token_test(args: argparse.Namespace) -> None:
    config = _load_and_prepare_config(args)
    payload = {}
    if args.room:
        payload["room"] = args.room
    if args.identity:
        payload["identity"] = args.identity
    try:
        response = _send_command(config, "token-test", payload or None)
        print(response.get("token"))
        return
    except SystemExit:
        pass

    room = args.room or config.room_name
    identity = args.identity or config.participant_identity
    if not room or not identity:
        raise SystemExit("Room and identity are required for token-test")
    service = TokenService(config.token_server_url)
    try:
        token = service.fetch_token(room, identity, force=True)
    except TokenServiceError as exc:
        raise SystemExit(str(exc)) from exc
    print(token)


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="LiveKit audio client for Raspberry Pi")
    parser.add_argument("--env", help="Path to .env file", default=None)
    parser.add_argument("--livekit-url", dest="livekit_url", help="LiveKit server URL")
    parser.add_argument("--token-server-url", dest="token_server_url", help="Token server URL override")
    parser.add_argument("--log-level", help="Logging level (default from config)")
    parser.add_argument("--input-device", help="Preferred input device name")
    parser.add_argument("--output-device", help="Preferred output device name")
    parser.add_argument("--sample-rate", dest="sample_rate", type=int, help="Audio sample rate")
    parser.add_argument("--audio-channels", dest="audio_channels", type=int, help="Number of audio channels")

    subparsers = parser.add_subparsers(dest="command")

    join_parser = subparsers.add_parser("join", help="Join a LiveKit room and run the audio service")
    join_parser.add_argument("--room", help="Room name")
    join_parser.add_argument("--identity", help="Participant identity")
    join_parser.set_defaults(func=command_join)

    mute_parser = subparsers.add_parser("mute", help="Mute the microphone")
    mute_parser.set_defaults(func=command_mute)

    unmute_parser = subparsers.add_parser("unmute", help="Unmute the microphone")
    unmute_parser.set_defaults(func=command_unmute)

    status_parser = subparsers.add_parser("status", help="Show service status")
    status_parser.set_defaults(func=command_status)

    devices_parser = subparsers.add_parser("devices", help="List audio devices")
    devices_parser.add_argument("--local", action="store_true", help="List devices locally without service")
    devices_parser.set_defaults(func=command_devices)

    token_parser = subparsers.add_parser("token-test", help="Fetch a token for testing")
    token_parser.add_argument("--room", help="Room name override")
    token_parser.add_argument("--identity", help="Participant identity override")
    token_parser.set_defaults(func=command_token_test)

    return parser


def main(argv: Optional[list[str]] = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    if not hasattr(args, "func"):
        parser.print_help()
        return 1
    try:
        args.func(args)
    except SystemExit as exc:
        if exc.code not in (0, None):
            print(exc, file=sys.stderr)
            return exc.code if isinstance(exc.code, int) else 1
        return 0
    return 0


__all__ = ["main", "build_parser"]
