"""Connexions HTTPS forcées en IPv4 (Brevo n'autorise que des IP IPv4 déclarées)."""

from __future__ import annotations

import socket
from http.client import HTTPSConnection
from urllib.request import HTTPSHandler, OpenerDirector, build_opener


def connect_ipv4(host: str, port: int, timeout: float | None) -> socket.socket:
    """Ouvre un socket TCP en n'utilisant que les adresses A (jamais AAAA)."""
    last_error: OSError | None = None
    for family, kind, proto, _name, addr in socket.getaddrinfo(host, port, socket.AF_INET, socket.SOCK_STREAM):
        sock = socket.socket(family, kind, proto)
        try:
            if timeout is not None:
                sock.settimeout(timeout)
            sock.connect(addr)
            return sock
        except OSError as e:
            sock.close()
            last_error = e
    raise last_error or OSError(f"Aucune adresse IPv4 pour {host}")


class IPv4HTTPSConnection(HTTPSConnection):
    def connect(self) -> None:
        sock = connect_ipv4(self.host, self.port, self.timeout)
        self.sock = self._context.wrap_socket(sock, server_hostname=self.host)


class IPv4HTTPSHandler(HTTPSHandler):
    def https_open(self, req):
        return self.do_open(IPv4HTTPSConnection, req)


def build_ipv4_opener() -> OpenerDirector:
    return build_opener(IPv4HTTPSHandler())
