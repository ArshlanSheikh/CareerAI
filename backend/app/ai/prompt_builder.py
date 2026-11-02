import json

BASE_SYSTEM_INSTRUCTION = """
You are a senior professional resume architect and career advisor for university students, interns, and job applicants.
CRITICAL INTEGRITY RULES:
1. NEVER invent technologies, programming languages, or tools not mentioned or directly relevant.
2. NEVER invent work experience, companies, qualifications, or credentials.
3. NEVER invent statistics, metrics, or revenue claims that were not provided.
4. NEVER claim the student implemented a feature without supporting information.
5. Elevate clarity, professional vocabulary, action verbs (e.g. Architected, Engineered, Streamlined), conciseness, and impact without altering truthful facts.
6. Return your response STRICTLY as valid JSON adhering to the specified schema.
"""


class PromptBuilder:
    @staticmethod
    def build_summary_prompt(
        original_summary: str = "",
        target_role: str = "",
        experience_level: str = "Entry Level / Student",
        skills_context: list = None,
        education_context: list = None,
        projects_context: list = None,
        experience_context: list = None,
        custom_instructions: str = "",
    ) -> str:
        skills_summary = ", ".join([", ".join(c.get("items", [])) for c in (skills_context or [])])
        edu_summary = ", ".join([f"{e.get('degree')} at {e.get('institution')}" for e in (education_context or [])])
        proj_summary = ", ".join([p.get("name", "") for p in (projects_context or []) if p.get("name")])
        exp_summary = ", ".join([f"{x.get('job_title')} at {x.get('company_name')}" for x in (experience_context or []) if x.get("company_name")])

        prompt = f"""
TASK: Craft an impactful, ATS-optimized 2 to 4 sentence Professional Summary for a student's resume.

STUDENT PROFILE CONTEXT:
- Target Role: {target_role or 'Software Engineer'}
- Experience Level: {experience_level}
- Verified Skills: {skills_summary or 'Not specified'}
- Education: {edu_summary or 'Not specified'}
- Highlight Projects: {proj_summary or 'Not specified'}
- Work Experience: {exp_summary or 'None'}
- Existing Summary (if any): "{original_summary}"
- Student Custom Guidance: "{custom_instructions or 'Focus on strong technical foundations and career readiness'}"

JSON RESPONSE SCHEMA:
{{
  "suggested_content": "The 2-4 sentence polished professional summary text",
  "changes_summary": "1-2 sentences explaining what was improved (e.g. stronger action verbs, clearer target role alignment)",
  "factual_warnings": ["List of any potential unsupported claims or empty array if completely grounded"]
}}
"""
        return prompt.strip()

    @staticmethod
    def build_project_prompt(
        project_name: str,
        technologies: list,
        original_description: str,
        key_contributions: list,
        personally_implemented_features: list,
        custom_instructions: str = "",
    ) -> str:
        prompt = f"""
TASK: Improve the presentation, bullet points, and impact of a student's project on their resume.

PROJECT DETAILS:
- Project Name: {project_name}
- Tech Stack: {', '.join(technologies or [])}
- Original Overview: "{original_description}"
- Current Contributions: {json.dumps(key_contributions or [])}
- Features Personally Developed: {json.dumps(personally_implemented_features or [])}
- Student Instructions: "{custom_instructions or 'Make bullets active, concise, and professional using XYZ resume formula (Accomplished [X] as measured by [Y], by doing [Z]) without inventing unverified numbers'}"

JSON RESPONSE SCHEMA:
{{
  "suggested_description": "Clean, concise 1-2 sentence project overview",
  "suggested_bullets": [
    "High-impact bullet point 1 starting with strong past-tense action verb",
    "High-impact bullet point 2 emphasizing personally built architecture"
  ],
  "changes_summary": "Summary of stylistic and clarity improvements made",
  "factual_warnings": ["Warnings if any metrics cannot be verified from the original input"]
}}
"""
        return prompt.strip()

    @staticmethod
    def build_experience_prompt(
        company_name: str,
        job_title: str,
        responsibilities: list,
        achievements: list,
        technologies: list,
        custom_instructions: str = "",
    ) -> str:
        prompt = f"""
TASK: Polish the responsibilities and accomplishments for this work experience record.

EXPERIENCE DETAILS:
- Role: {job_title}
- Company: {company_name}
- Current Responsibilities: {json.dumps(responsibilities or [])}
- Current Achievements: {json.dumps(achievements or [])}
- Technologies: {', '.join(technologies or [])}
- Student Custom Instructions: "{custom_instructions or 'Strengthen action verbs, remove passive voice, and improve readability'}"

JSON RESPONSE SCHEMA:
{{
  "suggested_responsibilities": [
    "Refined bullet point 1 starting with strong action verb",
    "Refined bullet point 2 highlighting ownership and deliverables"
  ],
  "changes_summary": "Explanation of clarity and active voice enhancements",
  "factual_warnings": ["Any warnings regarding inferred metrics"]
}}
"""
        return prompt.strip()

    @staticmethod
    def build_internship_prompt(
        organization: str,
        position: str,
        responsibilities: list,
        skills_learned: list,
        custom_instructions: str = "",
    ) -> str:
        prompt = f"""
TASK: Refine internship bullet points to emphasize learning agility, technical deliverables, and collaboration.

INTERNSHIP DETAILS:
- Position: {position}
- Organization: {organization}
- Current Responsibilities: {json.dumps(responsibilities or [])}
- Skills Learned: {', '.join(skills_learned or [])}
- Custom Instructions: "{custom_instructions or 'Elevate professionalism and highlight technical contributions'}"

JSON RESPONSE SCHEMA:
{{
  "suggested_responsibilities": [
    "Polished internship bullet point 1",
    "Polished internship bullet point 2"
  ],
  "changes_summary": "Summary of improvements",
  "factual_warnings": []
}}
"""
        return prompt.strip()

    @staticmethod
    def build_skills_prompt(
        target_role: str,
        existing_skills: list,
        projects: list,
        experience: list,
    ) -> str:
        existing_names = []
        for cat in (existing_skills or []):
            existing_names.extend(cat.get("items", []))

        prompt = f"""
TASK: Based on the student's actual projects, work experience, and target role, suggest relevant, standard technical skills they appear to know but may have omitted.
DO NOT suggest skills that have zero foundation in their provided projects or background.

CONTEXT:
- Target Role: {target_role or 'Software Engineer'}
- Existing Skills Listed: {', '.join(existing_names)}
- Projects Details: {json.dumps([{'name': p.get('name'), 'tech': p.get('technologies')} for p in (projects or [])])}
- Work Experience Details: {json.dumps([{'title': e.get('job_title'), 'tech': e.get('technologies')} for e in (experience or [])])}

JSON RESPONSE SCHEMA:
{{
  "suggested_skills": [
    {{
      "category": "Suggested Category (e.g. Developer Tools, Testing, Frontend)",
      "skills": ["Skill1", "Skill2"],
      "reason": "Why this skill is inferred from their projects/experience"
    }}
  ],
  "changes_summary": "Explanation of skill suggestions based strictly on their existing project technologies"
}}
"""
        return prompt.strip()

    @staticmethod
    def build_pdf_extraction_prompt(raw_text: str) -> str:
        prompt = f"""
TASK: Convert the following raw extracted resume text into the CareerAI standardized resume JSON schema.

RAW EXTRACTED RESUME TEXT:
\"\"\"
{raw_text}
\"\"\"

CRITICAL EXTRACTION GUIDELINES:
1. Missing fields MUST remain empty (empty strings "" or empty arrays []). NEVER fabricate or invent phone numbers, addresses, LinkedIn/GitHub links, graduation dates, or grades if not explicitly found in the text.
2. Ensure high accuracy: Capture exact job titles, dates, company names, educational institutions, degrees, and technologies.
3. Clean up formatting: Strip page numbers, broken hyphens, duplicated header lines, or PDF line breaks within sentences.
4. Categorize skills: Group technical skills into meaningful categories (e.g. "Programming Languages", "Frameworks & Libraries", "Databases & Cloud", "Developer Tools").
5. Format every record with a unique identifier:
   - Education: "id": "EDU_1", "EDU_2", ...
   - Skills: "id": "SKILL_1", "SKILL_2", ...
   - Projects: "id": "PROJ_1", "PROJ_2", ...
   - Work Experience: "id": "EXP_1", "EXP_2", ...
   - Internships: "id": "INT_1", "INT_2", ...
   - Certifications: "id": "CERT_1", "CERT_2", ...

REQUIRED JSON RESPONSE SCHEMA:
{{
  "personal_info": {{
    "full_name": "Full name found in resume or empty string",
    "email": "Email address or empty string",
    "phone": "Phone number or empty string",
    "city": "City or empty string",
    "state": "State or empty string",
    "country": "Country or empty string",
    "linkedin_url": "LinkedIn profile link or empty string",
    "github_url": "GitHub profile link or empty string",
    "portfolio_url": "Portfolio or personal site link or empty string",
    "profile_image": ""
  }},
  "professional_summary": {{
    "content": "Professional summary or objective statement text, or empty string if not present",
    "target_role": "Inferred target role from title/headline or software engineer",
    "experience_level": "Entry Level / Student or Fresher"
  }},
  "education": [
    {{
      "id": "EDU_1",
      "degree": "e.g. Bachelor of Science / B.Tech",
      "field_of_study": "e.g. Computer Science",
      "institution": "University / College name",
      "start_year": "Start year (e.g. 2020) or empty string",
      "end_year": "End year (e.g. 2024) or empty string",
      "grade_type": "GPA or Percentage",
      "grade": "GPA/Score if present in text, or empty string",
      "description": "Any honors, coursework, or activities mentioned"
    }}
  ],
  "skills": [
    {{
      "id": "SKILL_1",
      "category": "e.g. Programming Languages",
      "items": ["Python", "Java", "C++"]
    }}
  ],
  "projects": [
    {{
      "id": "PROJ_1",
      "name": "Project name",
      "description": "Brief description of what the project does",
      "technologies": ["React", "Node.js"],
      "role": "Role (e.g. Developer) or empty string",
      "start_date": "Start date or empty string",
      "end_date": "End date or empty string",
      "github_url": "GitHub URL if present",
      "live_url": "Live URL if present",
      "key_contributions": ["Bullet point of contribution 1"],
      "personally_implemented_features": ["Bullet point of feature personally implemented"]
    }}
  ],
  "work_experience": [
    {{
      "id": "EXP_1",
      "company_name": "Company name",
      "job_title": "Job title",
      "employment_type": "Full-time / Part-time / Contract",
      "location": "Location or Remote",
      "start_date": "Start date (e.g. Jun 2023)",
      "end_date": "End date (e.g. Aug 2023 or Present)",
      "is_current": false,
      "responsibilities": ["Responsibility or accomplishment bullet"],
      "achievements": [],
      "technologies": ["Tools used"]
    }}
  ],
  "internships": [
    {{
      "id": "INT_1",
      "organization": "Organization name",
      "position": "Internship role",
      "start_date": "Start date",
      "end_date": "End date",
      "responsibilities": ["Responsibility bullets"],
      "skills_learned": ["Skills"],
      "projects_completed": []
    }}
  ],
  "certifications": [
    {{
      "id": "CERT_1",
      "certification_name": "Certification name",
      "issuing_organization": "Issuer",
      "issue_date": "Date",
      "credential_url": "URL or empty string"
    }}
  ],
  "additional_info": {{
    "awards": [],
    "hackathons": [],
    "publications": [],
    "volunteer_experience": [],
    "languages": []
  }}
}}
"""
        return prompt.strip()


