import asyncio
import httpx
import json

async def inspect():
    async with httpx.AsyncClient() as client:
        res = await client.get("https://swissdevjobs.ch/api/jobsLight")
        data = res.json()
        if data:
            print(json.dumps(data[0], indent=2))
        else:
            print("No data")

if __name__ == "__main__":
    asyncio.run(inspect())
