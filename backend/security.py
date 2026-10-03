"""Small shared security helpers."""
import html
import time
from collections import defaultdict

from fastapi import HTTPException, Request


def client_ip(request: Request) -> str:
    """
    The visitor's address, not the hosting proxy's. Behind Render every request
    reaches the app from the proxy, so keying a rate limit on request.client.host
    would put all visitors in one bucket.
    """
    for header in ("cf-connecting-ip", "true-client-ip"):
        value = request.headers.get(header)
        if value:
            return value.strip()
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def esc(value) -> str:
    """Escape customer-supplied text before it goes into an HTML email."""
    return html.escape(str(value if value is not None else ""), quote=True)


class RateLimit:
    """In-memory sliding window per visitor. Resets when the process restarts."""

    def __init__(self, max_calls: int, window_seconds: int, message: str = "Too many requests. Please wait a moment."):
        self.max_calls, self.window, self.message = max_calls, window_seconds, message
        self.store: dict = defaultdict(list)

    def __call__(self, request: Request):
        ip, now = client_ip(request), time.time()
        recent = [t for t in self.store[ip] if t > now - self.window]
        if len(recent) >= self.max_calls:
            self.store[ip] = recent
            raise HTTPException(status_code=429, detail=self.message)
        recent.append(now)
        self.store[ip] = recent
