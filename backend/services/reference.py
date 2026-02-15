import httpx
import logging
from typing import Optional, Dict

logger = logging.getLogger(__name__)

REFERENCE_API_BASE = "https://www.job-room.ch/referenceservice/api"

async def resolve_occupation_code(term: str) -> Optional[str]:
    """
    Search for an occupation by label (e.g. "Software Engineer") and return its AVAM code.
    Returns None if no suitable match is found.
    """
    url = f"{REFERENCE_API_BASE}/_search/occupations/label"
    params = {
        "prefix": term,
        "types": "AVAM,CHISCO3,CHISCO5",
        "resultSize": 10,
        "_ng": "ZW4=" # English
    }
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url, params=params)
            response.raise_for_status()
            data = response.json()
            
            occupations = data.get("occupations", [])
            if not occupations:
                return None
            
            # Simple heuristic: return the code of the first result
            # In a more advanced version, we could fuzzy match or ask LLM to pick
            first_match = occupations[0]
            if first_match.get("type") == "AVAM":
                return first_match.get("code")
            
            # If mapped
            mappings = first_match.get("mappings", {})
            return mappings.get("AVAM")
            
    except Exception as e:
        logger.error(f"Error resolving occupation '{term}': {e}")
        return None
