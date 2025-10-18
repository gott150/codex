# Manual QA Checklist

Use this checklist before shipping updates to the LiveKit audio service.

## Environment preparation

- [ ] Raspberry Pi Zero 2 with Raspberry Pi OS Bookworm (64-bit) updated via `sudo apt update && sudo apt upgrade`.
- [ ] Install system dependencies:
  - `sudo apt install python3 python3-venv python3-pip portaudio19-dev libasound2-dev`
  - Optional: `sudo apt install tmux git` for remote sessions.
- [ ] Copy `.env` from `.env.example` and populate LiveKit URL, token server URL, room, and participant identity.

## Application setup

- [ ] Create and activate a Python virtual environment: `python3 -m venv .venv && source .venv/bin/activate`.
- [ ] Install the project in editable mode: `pip install -e .[dev]`.
- [ ] Run unit tests: `pytest`.

## Functional verification

- [ ] Start the service: `python -m livekit_client join --room <room> --identity <participant>`.
- [ ] From a second shell, confirm status: `python -m livekit_client status`.
- [ ] Toggle mute/unmute and verify remote participants no longer hear audio.
- [ ] Run `python -m livekit_client devices` to confirm audio device enumeration.
- [ ] Terminate the service (Ctrl+C) and ensure `/tmp/livekit_client.sock` and PID file are removed.

## Token validation

- [ ] Execute `python -m livekit_client token-test --room <room> --identity <participant>` and confirm a token is returned.
- [ ] Confirm the token server logs a request from the Pi.

## Audio validation

- [ ] Verify local microphone audio reaches the room by monitoring remote participant audio levels.
- [ ] Confirm remote audio playback works through connected speakers/headphones.
- [ ] Test reconnection by disabling network temporarily and ensuring the client recovers.

## Observability

- [ ] Review log output for warnings or errors.
- [ ] Ensure log rotation/systemd journal keeps logs manageable when running as a service.
