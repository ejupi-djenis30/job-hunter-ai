from abc import ABC, abstractmethod
from typing import List
from backend.providers.jobs.models import JobListing, JobSearchRequest

class JobProvider(ABC):
    @abstractmethod
    async def search(self, request: JobSearchRequest) -> List[JobListing]:
        """Search for jobs."""
        pass

