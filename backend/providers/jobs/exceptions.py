class ProviderError(Exception):
    """Base exception for provider errors."""
    def __init__(self, provider: str, message: str):
        self.provider = provider
        self.message = message
        super().__init__(f"[{provider}] {message}")

class ResponseParseError(ProviderError):
    """Raised when response parsing fails."""
    pass

class LocationNotFoundError(Exception):
    """Raised when a location cannot be resolved."""
    pass
