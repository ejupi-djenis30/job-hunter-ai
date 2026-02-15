"""
HTTP Session management with security bypass capabilities.

Implements browser fingerprint simulation, CSRF handling, and proxy rotation
for evading WAF detection on target job portals.
"""

import logging
import random
from enum import Enum
from typing import Any

import httpx
from tenacity import (
    retry,
    retry_if_exception_type,
    stop_after_attempt,
    wait_exponential_jitter,
)

from backend.scraper.core.exceptions import (
    AuthenticationError,
    NetworkError,
    RateLimitError,
)

logger = logging.getLogger(__name__)


class ExecutionMode(str, Enum):
    """
    Execution modes for different stealth/speed tradeoffs.

    FAST: Minimal evasion, maximum speed
    STEALTH: Full browser fingerprint simulation (recommended)
    AGGRESSIVE: Stealth + proxy rotation
    """

    FAST = "fast"
    STEALTH = "stealth"
    AGGRESSIVE = "aggressive"


# =============================================================================
# User-Agent and Header Configurations
# =============================================================================

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
]


def get_chrome_headers(version: str = "124") -> dict[str, str]:
    """Generate the complete set of headers that Chrome sends."""
    user_agent = (
        f"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        f"(KHTML, like Gecko) Chrome/{version}.0.0.0 Safari/537.36"
    )
    sec_ch_ua = (
        f'"Chromium";v="{version}", "Google Chrome";v="{version}", '
        '"Not-A.Brand";v="99"'
    )
    return {
        "User-Agent": user_agent,
        "Accept": "application/json, text/plain, */*",
        "Accept-Language": "en-US,en;q=0.9,de;q=0.8",
        "Accept-Encoding": "gzip, deflate, br",
        "Connection": "keep-alive",
        "sec-ch-ua": sec_ch_ua,
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"Windows"',
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "same-origin",
    }


# =============================================================================
# Proxy Pool (for AGGRESSIVE mode)
# =============================================================================


class ProxyPool:
    """Manages proxy rotation for distributed requests."""

    def __init__(self, proxies: list[str] | None = None):
        self.proxies = proxies or []
        self.current_index = 0
        self.cooldown: dict[str, float] = {}

    def get_proxy(self) -> str | None:
        """Get next available proxy from the pool."""
        if not self.proxies:
            return None

        import time

        now = time.time()

        for _ in range(len(self.proxies)):
            proxy = self.proxies[self.current_index]
            self.current_index = (self.current_index + 1) % len(self.proxies)

            if proxy not in self.cooldown or self.cooldown[proxy] < now:
                return proxy

        return self.proxies[0]

    def mark_failed(self, proxy: str, cooldown_seconds: int = 600) -> None:
        """Mark a proxy as temporarily unavailable."""
        import time

        self.cooldown[proxy] = time.time() + cooldown_seconds
        logger.warning(
            f"Proxy {proxy[:20]}... marked for cooldown ({cooldown_seconds}s)"
        )


# =============================================================================
# Scraper Session
# =============================================================================


class ScraperSession:
    """
    Manages HTTP sessions with security bypass capabilities.

    Features:
    - Browser fingerprint simulation (headers, Client Hints)
    - HTTP/2 support for TLS fingerprint evasion
    - Automatic CSRF token handling
    - Retry logic with exponential backoff
    - Optional proxy rotation
    """

    def __init__(
        self,
        mode: ExecutionMode = ExecutionMode.STEALTH,
        proxy_pool: ProxyPool | None = None,
        base_url: str | None = None,
        timeout: float = 30.0,
    ):
        self.mode = mode
        self.proxy_pool = proxy_pool
        self.base_url = base_url
        self.timeout = timeout
        self.client: httpx.AsyncClient | None = None
        self.csrf_token: str | None = None
        self._chrome_version = random.choice(["122", "123", "124"])

    async def __aenter__(self) -> "ScraperSession":
        await self.start()
        return self

    async def __aexit__(self, exc_type: Any, exc_val: Any, exc_tb: Any) -> None:
        await self.close()

    async def start(self) -> None:
        """Initialize the HTTP client with appropriate settings."""
        headers = self._get_headers()

        proxy = None
        if self.mode == ExecutionMode.AGGRESSIVE and self.proxy_pool:
            proxy = self.proxy_pool.get_proxy()

        self.client = httpx.AsyncClient(
            base_url=self.base_url or "",
            headers=headers,
            timeout=self.timeout,
            follow_redirects=True,
            http2=self.mode != ExecutionMode.FAST,
            proxy=proxy,
        )

        logger.debug(f"Session started in {self.mode.value} mode")

    async def close(self) -> None:
        """Close the HTTP client."""
        if self.client:
            await self.client.aclose()
            self.client = None

    def _get_headers(self) -> dict[str, str]:
        """Get headers based on execution mode."""
        if self.mode == ExecutionMode.FAST:
            return {
                "User-Agent": USER_AGENTS[0],
                "Accept": "application/json",
            }

        return get_chrome_headers(self._chrome_version)

    async def refresh_csrf_token(
        self, url: str, cookie_name: str = "XSRF-TOKEN"
    ) -> str | None:
        """Fetch CSRF token from the target site."""
        if not self.client:
            await self.start()

        if self.client is None:
            raise NetworkError("Session not started")

        try:
            response = await self.client.get(url)
            response.raise_for_status()

            token = response.cookies.get(cookie_name)
            if token:
                self.csrf_token = token
                logger.debug(f"CSRF token refreshed: {token[:10]}...")
            else:
                logger.warning(f"CSRF cookie '{cookie_name}' not found")

            return self.csrf_token

        except httpx.RequestError as e:
            logger.error(f"Failed to refresh CSRF token: {e}")
            raise NetworkError(f"CSRF token refresh failed: {e}") from e

    @retry(
        retry=retry_if_exception_type((httpx.TransportError, httpx.TimeoutException)),
        stop=stop_after_attempt(3),
        wait=wait_exponential_jitter(initial=0.5, max=5),
    )
    async def get(
        self,
        url: str,
        params: dict[str, Any] | None = None,
        **kwargs: Any,
    ) -> httpx.Response:
        """Make a GET request with retry logic."""
        if not self.client:
            await self.start()

        if self.client is None:
            raise NetworkError("Session not started")

        try:
            response = await self.client.get(url, params=params, **kwargs)
            self._handle_response_errors(response)
            return response

        except httpx.RequestError as e:
            raise NetworkError(f"GET request failed: {e}") from e

    @retry(
        retry=retry_if_exception_type((httpx.TransportError, httpx.TimeoutException)),
        stop=stop_after_attempt(3),
        wait=wait_exponential_jitter(initial=0.5, max=5),
    )
    async def post(
        self,
        url: str,
        json: dict[str, Any] | None = None,
        data: dict[str, Any] | None = None,
        include_csrf: bool = True,
        **kwargs: Any,
    ) -> httpx.Response:
        """Make a POST request with CSRF token injection."""
        if not self.client:
            await self.start()

        headers = kwargs.pop("headers", {})

        if include_csrf and self.csrf_token:
            headers["X-XSRF-TOKEN"] = self.csrf_token

        if json is not None:
            headers["Content-Type"] = "application/json;charset=UTF-8"

        if self.client is None:
            raise NetworkError("Session not started")

        try:
            response = await self.client.post(
                url, json=json, data=data, headers=headers, **kwargs
            )
            self._handle_response_errors(response)
            return response

        except httpx.RequestError as e:
            raise NetworkError(f"POST request failed: {e}") from e

    def _handle_response_errors(self, response: httpx.Response) -> None:
        """Handle common HTTP error responses."""
        if response.status_code == 429:
            retry_after = response.headers.get("Retry-After")
            retry_seconds = int(retry_after) if retry_after else None

            if self.mode == ExecutionMode.AGGRESSIVE and self.proxy_pool:
                logger.info("Rate limited - rotating proxy")

            raise RateLimitError(
                provider="session",
                message="Rate limit exceeded",
                retry_after=retry_seconds,
            )

        if response.status_code in (401, 403):
            raise AuthenticationError(
                provider="session",
                message=f"Authentication failed: HTTP {response.status_code}",
            )

        response.raise_for_status()

    async def with_retry_csrf(
        self,
        method: str,
        url: str,
        csrf_refresh_url: str,
        **kwargs: Any,
    ) -> httpx.Response:
        """Make a request with automatic CSRF token refresh on auth failure."""
        try:
            if method.upper() == "GET":
                return await self.get(url, **kwargs)
            else:
                return await self.post(url, **kwargs)

        except AuthenticationError:
            logger.info("Auth failed, refreshing CSRF token and retrying...")
            await self.refresh_csrf_token(csrf_refresh_url)

            if method.upper() == "GET":
                return await self.get(url, **kwargs)
            else:
                return await self.post(url, **kwargs)
