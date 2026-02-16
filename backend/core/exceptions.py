class CoreException(Exception):
    """Base exception for the application"""
    pass

class ProviderError(CoreException):
    """Raised when an external provider (LLM, Scraper) fails"""
    pass

class ConfigurationError(CoreException):
    """Raised when configuration is invalid"""
    pass

class ResourceNotFound(CoreException):
    """Raised when a requested resource is not found"""
    pass
