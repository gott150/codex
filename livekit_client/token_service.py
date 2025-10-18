"""Runtime LiveKit token retrieval."""
from __future__ import annotations

import json
from typing import Optional

import requests

from .logging_config import get_logger


_LOG = get_logger(__name__)


class TokenServiceError(RuntimeError):
    """Raised when the token server cannot provide a token."""


class TokenService:
    def __init__(self, token_url: str, timeout: float = 5.0) -> None:
        self.token_url = token_url
        self.timeout = timeout
        self._cached_token: Optional[str] = None
        self._cached_room: Optional[str] = None
        self._cached_identity: Optional[str] = None

    def fetch_token(self, room_name: str, participant_identity: str, force: bool = False) -> str:
        """Fetch a token for ``room_name`` and ``participant_identity``."""

        if not force and self._cached_token and self._cached_room == room_name and self._cached_identity == participant_identity:
            _LOG.debug("Using cached LiveKit token for room %s", room_name)
            return self._cached_token

        params = {"roomName": room_name, "participant_identity": participant_identity}
        try:
            response = requests.get(self.token_url, params=params, timeout=self.timeout)
        except requests.RequestException as exc:  # pragma: no cover - network failure path
            raise TokenServiceError(f"Failed to contact token server: {exc}") from exc

        if response.status_code != 200:
            raise TokenServiceError(f"Token server returned status {response.status_code}: {response.text}")

        try:
            payload = response.json()
        except json.JSONDecodeError as exc:
            raise TokenServiceError("Token server response is not valid JSON") from exc

        token = payload.get("token")
        if not token:
            raise TokenServiceError("Token server response missing 'token' field")

        self._cached_token = token
        self._cached_room = room_name
        self._cached_identity = participant_identity
        _LOG.debug("Fetched new LiveKit token for room %s", room_name)
        return token


__all__ = ["TokenService", "TokenServiceError"]
