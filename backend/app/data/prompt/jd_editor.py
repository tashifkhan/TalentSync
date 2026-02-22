"""LLM prompt templates for JD-targeted resume editing."""

EXTRACT_JD_KEYWORDS_PROMPT = """Extract all important keywords and requirements from this job description as JSON. Output ONLY the JSON object, no other text.

Format:
{{
  "required_skills": ["Python", "AWS", "REST APIs"],
  "preferred_skills": ["Kubernetes", "Terraform"],
  "experience_requirements": ["5+ years backend", "2+ years cloud"],
  "education_requirements": ["Bachelor's in Computer Science or related"],
  "key_responsibilities": ["Design distributed systems", "Lead technical reviews"],
  "keywords": ["microservices", "agile", "CI/CD", "scalability"],
  "seniority_level": "senior",
  "experience_years": 5,
  "role_title": "Senior Software Engineer",
  "domain": "backend infrastructure"
}}

Job Description:
{job_description}"""

SCORE_RESUME_AGAINST_JD_PROMPT = """Score this resume against the job description keywords from 0-100. Output ONLY a JSON object.

A score of 100 means the resume perfectly matches every keyword, skill, and requirement.
Score criteria:
- Required skills present: 60 points max
- Experience level match: 20 points max
- Key responsibilities covered: 20 points max

Job Keywords:
{job_keywords}

Resume (JSON):
{resume_json}

Output format:
{{
  "score": 72,
  "matched_keywords": ["Python", "REST APIs", "microservices"],
  "missing_required": ["Kubernetes", "AWS"],
  "missing_preferred": ["Terraform"],
  "score_breakdown": {{
    "required_skills": 45,
    "experience_level": 15,
    "responsibilities": 12
  }}
}}"""

EDIT_RESUME_FOR_JD_PROMPT = """You are a professional resume optimizer. Edit this resume to better match the job description. Output ONLY the JSON object, no other text.

CRITICAL TRUTHFULNESS RULES - NEVER VIOLATE:
1. DO NOT add any skill, tool, technology, or certification not explicitly mentioned in the original resume
2. DO NOT invent numeric achievements (e.g., "increased by 30%") unless they already exist in original
3. DO NOT add company names, product names, or technical terms not in the original
4. DO NOT upgrade experience level (e.g., "Junior" -> "Senior")
5. DO NOT extend employment dates or change timelines
6. DO NOT add new bullet points that describe work the candidate never mentions doing
7. Preserve all factual accuracy - only use information provided by the candidate
8. You MAY rephrase existing content to use JD-aligned language when the underlying fact is the same

Violation of these rules will harm the candidate in job interviews.

IMPORTANT: Generate ALL output text in {output_language}.

JOB DESCRIPTION:
{job_description}

JOB KEYWORDS TO WEAVE IN (only where the underlying experience already exists):
{job_keywords}

COMPANY: {company_name}

ORIGINAL RESUME (JSON):
{original_resume}

EDITING STRATEGY:
1. Rephrase existing bullet points to use keywords from the JD where the experience is genuinely present
2. Surface relevant skills that exist in the resume but weren't prominently mentioned
3. Reorder bullet points to lead with the most JD-relevant accomplishments
4. Tighten vague language into clearer, more impactful statements
5. If a "predicted_field" or "recommended_roles" can be made more JD-specific, update them
6. Do NOT remove any sections or entries

Output the complete updated resume in this JSON format:
{schema}"""

COMPUTE_JD_CHANGES_PROMPT = """Compare these two resume versions and list the specific changes made to target the job description. Output ONLY a JSON array.

ORIGINAL RESUME:
{original_resume}

EDITED RESUME:
{edited_resume}

JOB DESCRIPTION CONTEXT:
{job_description}

Output format - a JSON array of change objects:
[
  {{
    "field": "work_experience[0].bullet_points",
    "field_type": "description",
    "original": "Worked on backend APIs",
    "edited": "Designed and maintained RESTful APIs serving 50K daily requests",
    "reason": "Aligned with JD requirement for REST API experience"
  }},
  {{
    "field": "skills_analysis",
    "field_type": "skill",
    "original": "",
    "edited": "Kubernetes",
    "reason": "Surfaced existing Kubernetes experience to match required skill"
  }}
]

RULES:
- Only list fields that actually changed
- Be specific about which array index changed (e.g., work_experience[1].bullet_points)
- The reason must reference the JD requirement being addressed
- Keep original and edited values to one sentence each for clarity"""
