import socket

import pytest

from app.integrations.brevo import ipv4


def test_resolution_requests_ipv4_only(monkeypatch):
    seen: list[int] = []

    def fake_getaddrinfo(_host, _port, family=0, *_a, **_kw):
        seen.append(family)
        return []

    monkeypatch.setattr(ipv4.socket, "getaddrinfo", fake_getaddrinfo)
    with pytest.raises(OSError):
        ipv4.connect_ipv4("api.brevo.com", 443, 5)
    assert seen == [socket.AF_INET]


def test_connects_to_first_reachable_ipv4(monkeypatch):
    class FakeSock:
        def __init__(self, *_a):
            self.closed = False

        def settimeout(self, _t):
            pass

        def connect(self, addr):
            if addr[0] == "10.0.0.1":
                raise OSError("down")

        def close(self):
            self.closed = True

    infos = [(socket.AF_INET, socket.SOCK_STREAM, 6, "", ("10.0.0.1", 443)),
             (socket.AF_INET, socket.SOCK_STREAM, 6, "", ("10.0.0.2", 443))]
    monkeypatch.setattr(ipv4.socket, "getaddrinfo", lambda *_a, **_k: infos)
    monkeypatch.setattr(ipv4.socket, "socket", FakeSock)
    assert isinstance(ipv4.connect_ipv4("h", 443, 5), FakeSock)
