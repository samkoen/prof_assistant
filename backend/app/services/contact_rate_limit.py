"""Limites d'envoi « צור קשר » (fenêtre glissante, en mémoire)."""

import time
from collections import defaultdict, deque
from collections.abc import Callable, Hashable


class SlidingWindowLimiter:
    def __init__(self, max_events: int, window_seconds: float, clock: Callable[[], float] = time.monotonic):
        self._max = max_events
        self._window = window_seconds
        self._clock = clock
        self._events: dict[Hashable, deque[float]] = defaultdict(deque)

    def allow(self, key: Hashable) -> bool:
        """Enregistre l'envoi et retourne True s'il reste de la marge dans la fenêtre."""
        now = self._clock()
        events = self._events[key]
        while events and now - events[0] >= self._window:
            events.popleft()
        if len(events) >= self._max:
            return False
        events.append(now)
        return True


# Utilisateur connecté : 5 messages par heure.
contact_limiter = SlidingWindowLimiter(max_events=5, window_seconds=3600)
# Visiteur anonyme : 3 par heure et par IP, + plafond global pour limiter les dégâts si l'IP est usurpée.
public_ip_limiter = SlidingWindowLimiter(max_events=3, window_seconds=3600)
public_global_limiter = SlidingWindowLimiter(max_events=30, window_seconds=3600)
