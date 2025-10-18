# LiveKit Audio CLI for Raspberry Pi Zero 2

This package provides a lightweight command line client for LiveKit that targets the Raspberry Pi Zero 2. It publishes microphone audio, plays remote audio, and exposes mute/unmute and status controls via a Unix-domain-socket IPC channel.

## Features

- 48 kHz mono audio pipeline using PortAudio (`sounddevice`).
- Background daemon started with the `join` command.
- Commands for `mute`, `unmute`, `status`, `devices`, and `token-test` routed through IPC.
- Token retrieval from a configurable HTTP service (`TOKEN_SERVER_URL`).
- Automatic reconnection when the LiveKit room connection drops.
- Device discovery with fallback to system defaults.
- PID file and socket cleanup for robust restarts.

## Requirements

- Raspberry Pi Zero 2 running a recent Raspberry Pi OS release.
- Python 3.10 or newer.
- PortAudio development headers (`sudo apt install portaudio19-dev libasound2-dev`).
- Access to a LiveKit server and a token service endpoint.

## Installation

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -e .[dev]
cp .env.example .env
# Edit .env with your LiveKit URL, token server URL, room name, and identity
```

## Usage

Start the daemon and join a room:

```bash
python -m livekit_client join --room myroom --identity pi-zero
```

In another terminal, issue commands via IPC:

```bash
python -m livekit_client status
python -m livekit_client mute
python -m livekit_client unmute
python -m livekit_client devices
python -m livekit_client token-test --room myroom --identity pi-zero
```

To stop the service, press `Ctrl+C` in the terminal running `join` or send the `shutdown` IPC command.

## Configuration

The CLI reads configuration from environment variables. Populate `.env` using the provided `.env.example`.

| Variable                         | Description                                                             |
| -------------------------------- | ----------------------------------------------------------------------- |
| `LIVEKIT_URL`                    | WebSocket URL for the LiveKit server.                                   |
| `TOKEN_SERVER_URL`               | Token service endpoint (defaults to `http://localhost:5000/get_token`). |
| `ROOM_NAME`                      | Default room name when not provided on the CLI.                         |
| `PARTICIPANT_IDENTITY`           | Default participant identity.                                           |
| `INPUT_DEVICE` / `OUTPUT_DEVICE` | Partial device names to prefer.                                         |
| `AUDIO_SAMPLE_RATE`              | Audio sample rate (default 48000).                                      |
| `AUDIO_CHANNELS`                 | Number of channels (default 1).                                         |
| `LOG_LEVEL`                      | Logging verbosity.                                                      |
| `IPC_SOCKET_PATH`                | Override IPC socket path.                                               |
| `PID_FILE_PATH`                  | Override PID file path.                                                 |

## Raspberry Pi Zero 2 Notes

- Use a powered USB hub or HAT for reliable audio input/output.
- The default 48 kHz mono pipeline offers the best compatibility with LiveKit while balancing CPU usage.
- If the Pi cannot sustain 48 kHz, lower the sample rate via `AUDIO_SAMPLE_RATE` and adjust remote participants accordingly.
- Keep the token server on the same network or LAN to minimise latency.

## Testing

Run automated tests locally:

```bash
pytest
```

See `docs/QA_CHECKLIST.md` for manual QA steps and `docs/systemd.md` for service management guidance.
