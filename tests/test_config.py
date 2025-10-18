from livekit_client.config import DEFAULT_TOKEN_URL, load_config


def test_load_config_from_env(tmp_path, monkeypatch):
    env_file = tmp_path / ".env"
    env_file.write_text(
        "\n".join(
            [
                "LIVEKIT_URL=wss://example.livekit",
                "ROOM_NAME=test-room",
                "PARTICIPANT_IDENTITY=pi-zero",
                "LOG_LEVEL=debug",
                "AUDIO_SAMPLE_RATE=16000",
                "AUDIO_CHANNELS=1",
            ]
        )
    )

    config = load_config(env_file=str(env_file))

    assert config.livekit_url == "wss://example.livekit"
    assert config.room_name == "test-room"
    assert config.participant_identity == "pi-zero"
    assert config.log_level == "DEBUG"
    assert config.audio_sample_rate == 16000
    assert config.audio_channels == 1
    assert config.token_server_url == DEFAULT_TOKEN_URL


def test_load_config_with_overrides(monkeypatch):
    overrides = {
        "LIVEKIT_URL": "wss://override",
        "ROOM_NAME": "room",
        "PARTICIPANT_IDENTITY": "id",
        "TOKEN_SERVER_URL": "http://token",
    }
    config = load_config(overrides=overrides)
    assert config.livekit_url == "wss://override"
    assert config.token_server_url == "http://token"
    assert config.room_name == "room"
    assert config.participant_identity == "id"
