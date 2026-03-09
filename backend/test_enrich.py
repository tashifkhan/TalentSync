import asyncio
import json
import httpx

async def main():
    async with httpx.AsyncClient() as client:
        payload = {
            "resume_data": {
                "skills_analysis": [],
                "recommended_roles": [],
                "languages": [],
                "education": [],
                "work_experience": [{"role": None, "company_and_duration": None, "bullet_points": []}],
                "projects": [],
                "publications": [],
                "positions_of_responsibility": [],
                "certifications": [],
                "achievements": [],
                "name": "",
                "email": "",
                "contact": "",
                "predicted_field": ""
            }
        }
        res = await client.post("http://localhost:8000/api/v1/resume/enrichment/analyze", json=payload)
        print(res.status_code)
        print(res.text)

asyncio.run(main())
