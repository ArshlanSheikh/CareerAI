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
    def build_resume_analysis_prompt(resume_content: dict, target_role: str = "") -> str:
        prompt = f"""
TASK: Perform a rigorous, holistic, and constructive AI Resume Analysis for a student / job applicant.
Evaluate the resume objectively according to modern recruitment standards, tech industry benchmarks, and ATS scanner compatibility.

TARGET ROLE: {target_role or resume_content.get('professional_summary', {}).get('target_role') or 'Software Engineer / Technology Role'}

RESUME DATA TO ANALYZE:
{json.dumps(resume_content, indent=2)}

SCORING CRITERIA:
1. Overall Resume Score (0-100): Composite rating balancing clarity, technical skills, project depth, experience impact, and structural completeness.
2. ATS Compatibility Score (0-100): Estimation of machine readability, standard headings, parseable formatting, and keyword density. Note: Strictly an estimate.
3. Job Readiness Score (0-100): Alignment with industry standards, modern tech stacks, and hiring expectations for the target role.
4. Content Quality & Readability (0-100): Professional vocabulary, elimination of grammatical weaknesses, sentence length, and active voice.
5. Structure Completeness Score (0-100): Evaluation of how completely and properly sections are filled.
6. Section-by-Section Ratings for all 8 sections:
   - Summary, Skills, Education, Projects, Experience, Internships, Certifications, Additional Information.
7. Skill Distribution (for Donut Chart):
   - Categorize all identified skills into: Technical Skills, Tools & Cloud, Domain & Soft Skills.
8. Keyword Coverage:
   - Calculate percentage of relevant industry keywords present vs missing for the target role.
9. ATS Compliance Checklist:
   - Standard Headings, Single-Column Parsing, Contact Information, Date Formatting, Bullet Point Hierarchy.
10. 5 Quality Dimensions (Radar Chart 0-100):
   - Impact & Action Verbs, Quantification & Metrics, ATS Formatting, Technical Depth, Completeness & Structure.
11. Identify 3 to 5 clear Strengths.
12. Identify 3 to 6 genuine Weaknesses categorized as 'critical', 'warning', or 'suggestion'.
13. Provide 3 to 5 Actionable Recommendations with estimated score impact.

CRITICAL INTEGRITY:
- Base analysis ONLY on the candidate's actual provided data.
- NEVER penalize candidates for not fabricating unearned metrics; instead advise them on how to truthfully measure their work.

REQUIRED JSON RESPONSE SCHEMA:
{{
  "overall_score": 78,
  "ats_compatibility_score": 82,
  "job_readiness_score": 75,
  "content_quality_score": 75,
  "readability_score": 80,
  "structure_completeness_score": 85,
  "summary_score": 70,
  "skills_score": 85,
  "education_score": 90,
  "projects_score": 74,
  "experience_score": 72,
  "internships_score": 75,
  "certifications_score": 80,
  "additional_score": 75,
  "section_scores": {{
    "summary": {{
      "score": 70,
      "feedback": "Concise summary but lacks explicit alignment with backend cloud technologies.",
      "strengths": ["Clear role targeting", "Professional tone"],
      "improvements": ["Add 1-2 primary technical frameworks"]
    }},
    "skills": {{
      "score": 85,
      "feedback": "Strong categorization across programming languages and frameworks.",
      "found_skills": ["Python", "React", "MongoDB"],
      "recommended_keywords": ["REST APIs", "Docker", "Git"]
    }},
    "education": {{
      "score": 90,
      "feedback": "Degree, major, institution, and graduation year are well formatted.",
      "status": "Complete"
    }},
    "projects": {{
      "score": 74,
      "feedback": "Good variety of full-stack projects; bullet points can be strengthened using XYZ formula.",
      "tech_depth_score": 78,
      "impact_score": 70
    }},
    "experience": {{
      "score": 72,
      "feedback": "Experience is valuable; convert passive sentences to strong action verbs.",
      "action_verbs_score": 70,
      "quantification_score": 65
    }},
    "internships": {{
      "score": 75,
      "feedback": "Internship responsibilities demonstrate practical team contributions.",
      "count": 1
    }},
    "certifications": {{
      "score": 80,
      "feedback": "Relevant credentials support continuous learning.",
      "count": 1
    }},
    "additional_info": {{
      "score": 75,
      "feedback": "Extracurriculars and languages add personal dimension.",
      "count": 1
    }}
  }},
  "quality_dimensions": [
    {{ "dimension": "Impact & Action Verbs", "score": 72, "benchmark": 85 }},
    {{ "dimension": "Quantification & Metrics", "score": 65, "benchmark": 75 }},
    {{ "dimension": "ATS Formatting", "score": 88, "benchmark": 90 }},
    {{ "dimension": "Technical Depth", "score": 80, "benchmark": 80 }},
    {{ "dimension": "Completeness & Structure", "score": 85, "benchmark": 85 }}
  ],
  "skill_distribution": {{
    "technical_count": 8,
    "tools_count": 4,
    "soft_skills_count": 3,
    "distribution": [
      {{ "name": "Technical Skills", "value": 8, "percentage": 53, "color": "#6366f1" }},
      {{ "name": "Tools & Cloud", "value": 4, "percentage": 27, "color": "#a855f7" }},
      {{ "name": "Domain & Soft", "value": 3, "percentage": 20, "color": "#ec4899" }}
    ]
  }},
  "keyword_coverage": {{
    "matched_keywords_count": 12,
    "recommended_keywords_count": 5,
    "coverage_percentage": 71,
    "matched_keywords": ["Python", "FastAPI", "React", "PostgreSQL"],
    "missing_critical_keywords": ["Docker", "CI/CD", "AWS", "Unit Testing"]
  }},
  "ats_checklist": [
    {{ "item": "Standard Section Headings", "status": "pass", "note": "Headings conform to ATS parser recognition." }},
    {{ "item": "Contact Parseability", "status": "pass", "note": "Email and phone numbers are located in top header." }},
    {{ "item": "Linear Single-Column Layout", "status": "pass", "note": "No complex columns or tables that confuse OCR." }},
    {{ "item": "Standard Date Formats", "status": "pass", "note": "Consistent month/year chronological formats." }},
    {{ "item": "Action Verb Density", "status": "warning", "note": "Some project bullets begin with passive wording." }}
  ],
  "strengths": [
    {{
      "title": "Strong Technical Stack Organization",
      "description": "Skills are separated into clear categories which improves recruiter scanning.",
      "section": "skills"
    }}
  ],
  "weaknesses": [
    {{
      "title": "Unquantified Project Deliverables",
      "description": "Project bullet points describe features without indicating scale, active users, or throughput.",
      "severity": "warning",
      "section": "projects"
    }}
  ],
  "actionable_recommendations": [
    {{
      "id": "REC_1",
      "title": "Revamp Project Bullet Points with XYZ Formula",
      "description": "Start each bullet with an active verb (e.g., Engineered, Architected) and state technical outcome.",
      "section": "projects",
      "priority": "high",
      "estimated_score_boost": 6
    }}
  ],
  "disclaimer": "ATS compatibility and Job Readiness scores are estimations based on industry keyword density, format parseability, and structured criteria. They are actionable guidelines and not a factual guarantee of selection."
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

    @staticmethod
    def build_resume_enhancement_prompt(
        resume_content: dict,
        target_role: str = "",
        analysis_weaknesses: list = None,
        custom_instructions: str = "",
    ) -> str:
        weaknesses_str = ""
        if analysis_weaknesses:
            weaknesses_str = "\n".join([f"- {w}" for w in analysis_weaknesses[:8]])

        prompt = f"""
TASK: Generate a comprehensive, professional, AI-improved version of the applicant's resume.

TARGET ROLE: {target_role or "Software Engineering / Tech Professional"}
USER CUSTOM INSTRUCTIONS: {custom_instructions or "Elevate professional tone, strengthen action verbs, optimize for ATS keyword parsing, and improve impact clarity."}

DIAGNOSTIC WEAKNESSES TO REMEDY:
{weaknesses_str or "- General content polish, stronger action verbs, and improved impact articulation."}

CURRENT RESUME CONTENT (JSON):
```json
{json.dumps(resume_content, indent=2)}
```

STRICT ANTI-HALLUCINATION & ENHANCEMENT RULES:
1. NEVER invent employers, job titles, educational institutions, degrees, certifications, or project names.
2. NEVER invent technologies, programming languages, or tools not present or directly implied in the original.
3. NEVER invent fake statistics, revenue numbers, or fabricated percentages. If a bullet lacks numbers, do NOT add made-up figures like "increased sales by 85%". Instead, elevate the action verb, clarify the mechanism, and highlight the technical outcome (e.g. "Engineered modular REST APIs using FastAPI, enhancing response reliability and streamlining cross-service communication").
4. PROFESSIONAL SUMMARY: Rewrite into a compelling 2 to 4 sentence executive hook clearly aligned with the target role.
5. WORK EXPERIENCE & PROJECTS: Rewrite responsibilities and contributions into punchy, active-voice bullet points beginning with strong past-tense action verbs (e.g. Architected, Spearheaded, Implemented, Streamlined, Refactored, Deployed).
6. SKILLS: Preserve all verified skills while categorizing them into logical technical groups (e.g. Languages, Frameworks, Developer Tools, Databases).
7. Return a complete, valid improved resume JSON conforming to the standardized schema, plus an itemized section diff explaining the changes made.

JSON RESPONSE SCHEMA:
{{
  "enhancement_summary": "2-3 sentence overview of the structural and phrasing enhancements applied",
  "estimated_score_improvement": 15,
  "improved_content": {json.dumps(resume_content)},
  "section_diffs": [
    {{
      "section": "professional_summary",
      "title": "Professional Summary",
      "change_summary": ["1-3 bullet points describing what was improved"],
      "impact": "high"
    }},
    {{
      "section": "skills",
      "title": "Technical Skills",
      "change_summary": ["Bullet points describing categorization or standardization"],
      "impact": "medium"
    }},
    {{
      "section": "projects",
      "title": "Projects",
      "change_summary": ["Bullet points describing enhanced action verbs and clarity"],
      "impact": "high"
    }},
    {{
      "section": "experience",
      "title": "Experience",
      "change_summary": ["Bullet points describing improved bullet formulations"],
      "impact": "high"
    }}
  ]
}}
"""
        return prompt.strip()



