# Running as a systemd service

The CLI exposes a long-running daemon mode via the `join` command. Use the configuration below to manage it with `systemd` on a Raspberry Pi Zero 2.

## Prerequisites

1. Install project dependencies in a virtual environment (recommended) and note the path to the `python` executable.
2. Create `/opt/livekit-client` and copy the project files.
3. Populate `/opt/livekit-client/.env` using `.env.example`.

## Unit file example

Save the following to `/etc/systemd/system/livekit-client.service`:

```ini
[Unit]
Description=LiveKit audio client
After=network.target sound.target

[Service]
Type=simple
WorkingDirectory=/opt/livekit-client
EnvironmentFile=/opt/livekit-client/.env
ExecStart=/opt/livekit-client/.venv/bin/python -m livekit_client join --room %i --identity %H
Restart=on-failure
RestartSec=5
User=pi
Group=audio
LimitRTPRIO=50
LimitMEMLOCK=infinity

[Install]
WantedBy=multi-user.target
```

Adjust `ExecStart` to point at your virtual environment. The `%i` placeholder allows templated units (e.g. `systemctl start livekit-client@room-name.service`). Remove placeholders if you prefer static configuration.

## Managing the service

```bash
sudo systemctl daemon-reload
sudo systemctl enable livekit-client@yourroom.service
sudo systemctl start livekit-client@yourroom.service
```

Use `journalctl -u livekit-client@yourroom.service -f` to tail logs. The service cleans up its socket and PID file automatically when stopped.
