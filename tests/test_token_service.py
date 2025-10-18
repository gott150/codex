import pytest

from livekit_client.token_service import TokenService, TokenServiceError


class DummyResponse:
    def __init__(self, status_code=200, payload=None):
        self.status_code = status_code
        self._payload = payload or {"token": "abc"}
        self.text = ""

    def json(self):
        return self._payload


def test_fetch_token(monkeypatch):
    calls = {}

    def fake_get(url, params, timeout):
        calls["called"] = True
        assert params["roomName"] == "room"
        assert params["participant_identity"] == "id"
        return DummyResponse()

    monkeypatch.setattr("livekit_client.token_service.requests.get", fake_get)
    service = TokenService("http://token")
    token = service.fetch_token("room", "id")
    assert token == "abc"
    assert calls


def test_fetch_token_error(monkeypatch):
    def fake_get(url, params, timeout):
        return DummyResponse(status_code=500)

    monkeypatch.setattr("livekit_client.token_service.requests.get", fake_get)
    service = TokenService("http://token")
    with pytest.raises(TokenServiceError):
        service.fetch_token("room", "id")
