"""IPC helpers using Unix domain sockets."""
from __future__ import annotations

import asyncio
import json
import os
from asyncio import StreamReader, StreamWriter
from pathlib import Path
from typing import Awaitable, Callable, Dict, Optional

from .logging_config import get_logger

_LOG = get_logger(__name__)

CommandHandler = Callable[[Dict[str, object]], Awaitable[Dict[str, object]]]


class IPCError(RuntimeError):
    pass


class IPCServer:
    def __init__(self, socket_path: Path, handler: CommandHandler) -> None:
        self.socket_path = socket_path
        self.handler = handler
        self._server: Optional[asyncio.base_events.Server] = None

    async def start(self) -> None:
        self.stop()
        if self.socket_path.exists():
            try:
                self.socket_path.unlink()
            except OSError:
                _LOG.warning("Failed to remove stale socket %s", self.socket_path)
        self.socket_path.parent.mkdir(parents=True, exist_ok=True)
        self._server = await asyncio.start_unix_server(self._on_client, path=str(self.socket_path))
        _LOG.info("IPC server listening on %s", self.socket_path)

    async def _on_client(self, reader: StreamReader, writer: StreamWriter) -> None:
        try:
            raw = await reader.readline()
            if not raw:
                writer.write(b"{}\n")
                await writer.drain()
                return
            payload = json.loads(raw.decode())
            response = await self.handler(payload)
        except Exception as exc:  # pragma: no cover - defensive
            _LOG.exception("IPC handler error: %s", exc)
            response = {"status": "error", "error": str(exc)}
        writer.write(json.dumps(response).encode() + b"\n")
        await writer.drain()
        writer.close()
        await writer.wait_closed()

    async def run_forever(self) -> None:
        if self._server is None:
            raise IPCError("Server is not started")
        async with self._server:
            await self._server.serve_forever()

    def stop(self) -> None:
        if self._server is not None:
            self._server.close()
            self._server = None
        if self.socket_path.exists():
            try:
                self.socket_path.unlink()
            except OSError:
                _LOG.debug("Unable to unlink socket %s", self.socket_path)


class IPCClient:
    def __init__(self, socket_path: Path) -> None:
        self.socket_path = socket_path

    async def request(self, command: str, payload: Optional[Dict[str, object]] = None) -> Dict[str, object]:
        if not self.socket_path.exists():
            raise IPCError(f"IPC socket not found at {self.socket_path}")
        reader, writer = await asyncio.open_unix_connection(str(self.socket_path))
        message = {"command": command}
        if payload:
            message.update(payload)
        writer.write(json.dumps(message).encode() + b"\n")
        await writer.drain()
        data = await reader.readline()
        writer.close()
        await writer.wait_closed()
        if not data:
            return {}
        return json.loads(data.decode())

    def request_sync(self, command: str, payload: Optional[Dict[str, object]] = None) -> Dict[str, object]:
        return asyncio.run(self.request(command, payload))


__all__ = ["IPCServer", "IPCClient", "IPCError"]
