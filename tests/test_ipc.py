import asyncio

import pytest

from livekit_client.ipc import IPCClient, IPCServer


@pytest.mark.asyncio
async def test_ipc_roundtrip(tmp_path):
    socket_path = tmp_path / "ipc.sock"

    async def handler(message):
        assert message["command"] == "ping"
        return {"status": "ok", "pong": True}

    server = IPCServer(socket_path, handler)
    await server.start()

    client = IPCClient(socket_path)
    response = await client.request("ping")
    assert response["pong"] is True
    server.stop()
