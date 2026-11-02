import logging
import re
from typing import Dict, Any, List
from playwright.sync_api import sync_playwright
import pymupdf

logger = logging.getLogger(__name__)


class PdfGenerator:
    """
    High-fidelity PDF generation engine using Playwright and PyMuPDF.
    Preserves exact template styling, typography, page breaks, and generates selectable text.
    """

    @staticmethod
    def generate_pdf(resume_data: Dict[str, Any]) -> bytes:
        """
        Renders resume HTML and prints to PDF using headless Chrome/Edge.
        """
        html_content = PdfGenerator.render_html(resume_data)

        # Launch Playwright browser with resilient fallback
        with sync_playwright() as p:
            browser = None
            for channel in ["chrome", "msedge", None]:
                try:
                    launch_kwargs = {"headless": True}
                    if channel:
                        launch_kwargs["channel"] = channel
                    browser = p.chromium.launch(**launch_kwargs)
                    break
                except Exception as e:
                    logger.warning(f"Could not launch browser with channel {channel}: {e}")

            if not browser:
                raise RuntimeError("Failed to launch any headless browser for PDF generation.")

            try:
                page = browser.new_page()
                page.set_content(html_content, wait_until="load")
                pdf_bytes = page.pdf(
                    format="A4",
                    print_background=True,
                    prefer_css_page_size=True,
                    margin={
                        "top": "0.4in",
                        "bottom": "0.4in",
                        "left": "0.5in",
                        "right": "0.5in",
                    },
                )
            finally:
                browser.close()

        # Inject document metadata with PyMuPDF
        return PdfGenerator._inject_metadata(pdf_bytes, resume_data)

    @staticmethod
    def _inject_metadata(pdf_bytes: bytes, resume_data: Dict[str, Any]) -> bytes:
        try:
            doc = pymupdf.open(stream=pdf_bytes, filetype="pdf")
            content = resume_data.get("content", {})
            full_name = content.get("personal_info", {}).get("full_name") or "Student"
            title = resume_data.get("title") or f"{full_name} Resume"
            target_role = resume_data.get("target_role") or "Software Engineer"

            doc.set_metadata({
                "title": f"{full_name} - {title}",
                "author": full_name,
                "subject": f"Resume for {target_role}",
                "keywords": "Resume, CV, CareerAI, Education, Skills, Experience",
                "creator": "CareerAI Resume Builder",
                "producer": "CareerAI Headless PDF Engine",
            })
            out_bytes = doc.tobytes()
            doc.close()
            return out_bytes
        except Exception as e:
            logger.warning(f"Could not inject PDF metadata: {e}")
            return pdf_bytes

    @staticmethod
    def render_html(resume_data: Dict[str, Any]) -> str:
        template = (resume_data.get("template") or "modern").lower()
        title = resume_data.get("title", "Resume")
        content = resume_data.get("content", {})
        personal = content.get("personal_info", {})
        summary = content.get("professional_summary", {})
        education = content.get("education", [])
        skills = content.get("skills", [])
        projects = content.get("projects", [])
        experience = content.get("work_experience", [])
        internships = content.get("internships", [])
        certifications = content.get("certifications", [])
        additional = content.get("additional_info", {})
        section_order = content.get("section_order", [
            "summary", "education", "skills", "projects", "experience", "internships", "certifications", "additional"
        ])
        hidden_sections = set(content.get("hidden_sections", []))

        # Build contact items
        contact_items = []
        if personal.get("phone"):
            contact_items.append(personal["phone"])
        if personal.get("email"):
            contact_items.append(f'<a href="mailto:{personal["email"]}">{personal["email"]}</a>')
        location = ", ".join(filter(None, [personal.get("city"), personal.get("state"), personal.get("country")]))
        if location:
            contact_items.append(location)
        if personal.get("linkedin_url"):
            contact_items.append(f'<a href="{personal["linkedin_url"]}">LinkedIn</a>')
        if personal.get("github_url"):
            contact_items.append(f'<a href="{personal["github_url"]}">GitHub</a>')
        if personal.get("portfolio_url"):
            contact_items.append(f'<a href="{personal["portfolio_url"]}">Portfolio</a>')

        contact_html = " &bull; ".join(contact_items)

        # Section builders map
        def render_summary():
            if not summary.get("content"):
                return ""
            return f"""
            <section class="resume-section">
                <h2 class="section-title">Professional Summary</h2>
                <div class="summary-text">{summary.get("content")}</div>
            </section>
            """

        def render_education():
            if not education:
                return ""
            items_html = ""
            for edu in education:
                degree_line = f"{edu.get('degree', '')} in {edu.get('field_of_study', '')}".strip(" in")
                dates = " &ndash; ".join(filter(None, [edu.get("start_year"), edu.get("end_year")]))
                grade_str = f"Grade: {edu.get('grade')}" if edu.get("grade") else ""
                items_html += f"""
                <div class="record-item">
                    <div class="record-header">
                        <span class="record-title">{edu.get("institution", "")}</span>
                        <span class="record-date">{dates}</span>
                    </div>
                    <div class="record-sub">
                        <span>{degree_line}</span>
                        <span>{grade_str}</span>
                    </div>
                    {f'<div class="record-desc">{edu.get("description")}</div>' if edu.get("description") else ''}
                </div>
                """
            return f"""
            <section class="resume-section">
                <h2 class="section-title">Education</h2>
                {items_html}
            </section>
            """

        def render_skills():
            if not skills:
                return ""
            items_html = ""
            for cat in skills:
                cat_name = cat.get("category", "Skills")
                cat_items = ", ".join(cat.get("items", []))
                if cat_items:
                    items_html += f"""
                    <div class="skill-category">
                        <span class="skill-label">{cat_name}:</span>
                        <span class="skill-items">{cat_items}</span>
                    </div>
                    """
            return f"""
            <section class="resume-section">
                <h2 class="section-title">Technical Skills</h2>
                <div class="skills-wrapper">{items_html}</div>
            </section>
            """

        def render_projects():
            if not projects:
                return ""
            items_html = ""
            for proj in projects:
                dates = " &ndash; ".join(filter(None, [proj.get("start_date"), proj.get("end_date")]))
                tech_str = f"({', '.join(proj.get('technologies', []))})" if proj.get("technologies") else ""
                links = []
                if proj.get("github_url"):
                    links.append(f'<a href="{proj["github_url"]}">GitHub</a>')
                if proj.get("live_url"):
                    links.append(f'<a href="{proj["live_url"]}">Live Demo</a>')
                links_html = f" | {' | '.join(links)}" if links else ""

                bullets_html = ""
                bullets = proj.get("personally_implemented_features") or proj.get("key_contributions") or []
                if bullets:
                    bullets_html = "<ul>" + "".join([f"<li>{b}</li>" for b in bullets if b]) + "</ul>"

                items_html += f"""
                <div class="record-item">
                    <div class="record-header">
                        <span class="record-title">{proj.get("name", "")} <span class="record-tech">{tech_str}</span></span>
                        <span class="record-date">{dates}</span>
                    </div>
                    <div class="record-sub">
                        <span>{proj.get("role", "")}{links_html}</span>
                    </div>
                    {f'<div class="record-desc">{proj.get("description")}</div>' if proj.get("description") else ''}
                    {bullets_html}
                </div>
                """
            return f"""
            <section class="resume-section">
                <h2 class="section-title">Projects</h2>
                {items_html}
            </section>
            """

        def render_experience():
            if not experience:
                return ""
            items_html = ""
            for exp in experience:
                dates = f"{exp.get('start_date', '')} &ndash; {'Present' if exp.get('is_current') else exp.get('end_date', '')}".strip(" &ndash; ")
                bullets = exp.get("responsibilities") or []
                bullets_html = ""
                if bullets:
                    bullets_html = "<ul>" + "".join([f"<li>{b}</li>" for b in bullets if b]) + "</ul>"

                items_html += f"""
                <div class="record-item">
                    <div class="record-header">
                        <span class="record-title">{exp.get("company_name", "")}</span>
                        <span class="record-date">{dates}</span>
                    </div>
                    <div class="record-sub">
                        <span class="record-role">{exp.get("job_title", "")}</span>
                        <span>{exp.get("location", "")}</span>
                    </div>
                    {bullets_html}
                </div>
                """
            return f"""
            <section class="resume-section">
                <h2 class="section-title">Work Experience</h2>
                {items_html}
            </section>
            """

        def render_internships():
            if not internships:
                return ""
            items_html = ""
            for intn in internships:
                dates = " &ndash; ".join(filter(None, [intn.get("start_date"), intn.get("end_date")]))
                bullets = intn.get("responsibilities") or []
                bullets_html = ""
                if bullets:
                    bullets_html = "<ul>" + "".join([f"<li>{b}</li>" for b in bullets if b]) + "</ul>"

                items_html += f"""
                <div class="record-item">
                    <div class="record-header">
                        <span class="record-title">{intn.get("organization", "")}</span>
                        <span class="record-date">{dates}</span>
                    </div>
                    <div class="record-sub">
                        <span class="record-role">{intn.get("position", "")}</span>
                    </div>
                    {bullets_html}
                </div>
                """
            return f"""
            <section class="resume-section">
                <h2 class="section-title">Internships</h2>
                {items_html}
            </section>
            """

        def render_certifications():
            if not certifications:
                return ""
            items_html = ""
            for cert in certifications:
                items_html += f"""
                <div class="cert-item">
                    <span class="cert-name">{cert.get("certification_name", "")}</span>
                    <span class="cert-issuer">&ndash; {cert.get("issuing_organization", "")}</span>
                    {f'<span class="cert-date">({cert.get("issue_date")})</span>' if cert.get("issue_date") else ''}
                </div>
                """
            return f"""
            <section class="resume-section">
                <h2 class="section-title">Certifications</h2>
                <div class="certs-list">{items_html}</div>
            </section>
            """

        def render_additional():
            if not additional:
                return ""
            parts = []
            if additional.get("awards"):
                parts.append(f"<div><strong>Honors & Awards:</strong> {', '.join(additional['awards'])}</div>")
            if additional.get("hackathons"):
                parts.append(f"<div><strong>Hackathons:</strong> {', '.join(additional['hackathons'])}</div>")
            if additional.get("publications"):
                parts.append(f"<div><strong>Publications:</strong> {', '.join(additional['publications'])}</div>")
            if additional.get("languages"):
                parts.append(f"<div><strong>Languages:</strong> {', '.join(additional['languages'])}</div>")
            if additional.get("volunteer_experience"):
                parts.append(f"<div><strong>Volunteering:</strong> {', '.join(additional['volunteer_experience'])}</div>")
            if not parts:
                return ""
            return f"""
            <section class="resume-section">
                <h2 class="section-title">Additional Information</h2>
                <div class="additional-list">{''.join(parts)}</div>
            </section>
            """

        section_dispatch = {
            "summary": render_summary,
            "education": render_education,
            "skills": render_skills,
            "projects": render_projects,
            "experience": render_experience,
            "internships": render_internships,
            "certifications": render_certifications,
            "additional": render_additional,
        }

        # Render sections according to section_order
        sections_html = ""
        for sec in section_order:
            if sec not in hidden_sections and sec in section_dispatch:
                sections_html += section_dispatch[sec]()

        css_styles = PdfGenerator._get_template_css(template)

        return f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>{title}</title>
    <style>
        {css_styles}
    </style>
</head>
<body class="template-{template}">
    <div class="resume-document">
        <header class="resume-header">
            <h1 class="candidate-name">{personal.get("full_name") or "Your Name"}</h1>
            {f'<div class="target-role">{summary.get("target_role") or resume_data.get("target_role", "")}</div>' if (summary.get("target_role") or resume_data.get("target_role")) else ''}
            <div class="contact-info">{contact_html}</div>
        </header>
        <main class="resume-content">
            {sections_html}
        </main>
    </div>
</body>
</html>
"""

    @staticmethod
    def _get_template_css(template: str) -> str:
        base_reset = """
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @page { size: A4; margin: 10mm 12mm; }
        body {
            background-color: #ffffff;
            color: #1e293b;
            font-size: 10pt;
            line-height: 1.45;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }
        a { color: inherit; text-decoration: none; }
        .resume-document { width: 100%; max-width: 100%; margin: 0 auto; }
        .resume-section { margin-top: 11pt; page-break-inside: avoid; }
        .section-title { font-size: 11.5pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 5pt; page-break-after: avoid; }
        .record-item { margin-bottom: 7pt; page-break-inside: avoid; }
        .record-header { display: flex; justify-content: space-between; align-items: baseline; font-weight: 600; font-size: 10pt; }
        .record-title { color: #0f172a; }
        .record-date { font-size: 9pt; color: #475569; }
        .record-sub { display: flex; justify-content: space-between; font-size: 9.5pt; color: #334155; margin-top: 1pt; font-style: italic; }
        .record-desc { font-size: 9.5pt; color: #334155; margin-top: 2pt; }
        .record-tech { font-size: 9pt; font-weight: normal; color: #475569; font-style: italic; }
        ul { margin-top: 3pt; padding-left: 14pt; }
        li { font-size: 9.5pt; margin-bottom: 2pt; color: #1e293b; line-height: 1.4; }
        .skill-category { font-size: 9.5pt; margin-bottom: 2.5pt; }
        .skill-label { font-weight: 600; color: #0f172a; }
        .skill-items { color: #334155; }
        .cert-item { font-size: 9.5pt; margin-bottom: 2pt; }
        .cert-name { font-weight: 600; color: #0f172a; }
        .cert-issuer { color: #475569; }
        .cert-date { font-size: 9pt; color: #64748b; }
        .additional-list div { font-size: 9.5pt; margin-bottom: 3pt; }
        """

        if template == "ats":
            return base_reset + """
            body { font-family: Arial, Helvetica, sans-serif; color: #000000; }
            .candidate-name { font-size: 20pt; font-weight: bold; text-align: center; text-transform: uppercase; color: #000000; }
            .target-role { font-size: 11pt; text-align: center; font-weight: 600; margin-top: 2pt; color: #000000; }
            .contact-info { text-align: center; font-size: 9pt; margin-top: 4pt; padding-bottom: 6pt; border-bottom: 1.5pt solid #000000; color: #000000; }
            .section-title { border-bottom: 1pt solid #000000; padding-bottom: 2pt; color: #000000; }
            .record-title { color: #000000; }
            .record-date { color: #000000; }
            .record-sub { color: #000000; font-style: normal; }
            li { color: #000000; }
            """

        elif template == "traditional":
            return base_reset + """
            body { font-family: "Georgia", "Times New Roman", serif; color: #1a1a1a; }
            .resume-header { text-align: center; border-bottom: 1pt double #718096; padding-bottom: 8pt; margin-bottom: 4pt; }
            .candidate-name { font-size: 22pt; font-weight: normal; letter-spacing: 0.05em; color: #1a202c; font-variant: small-caps; }
            .target-role { font-size: 11pt; font-style: italic; color: #4a5568; margin-top: 2pt; }
            .contact-info { font-size: 9pt; margin-top: 4pt; color: #4a5568; }
            .section-title { font-variant: small-caps; border-bottom: 0.75pt solid #cbd5e1; padding-bottom: 2pt; color: #2d3748; letter-spacing: 0.06em; }
            .record-title { color: #1a202c; }
            .record-sub { font-style: italic; color: #4a5568; }
            """

        else:
            # Modern Professional (default)
            return base_reset + """
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
            .resume-header { border-bottom: 2pt solid #4f46e5; padding-bottom: 8pt; }
            .candidate-name { font-size: 22pt; font-weight: 800; color: #1e1b4b; letter-spacing: -0.02em; }
            .target-role { font-size: 12pt; font-weight: 600; color: #4f46e5; margin-top: 1pt; }
            .contact-info { font-size: 9pt; color: #64748b; margin-top: 4pt; }
            .contact-info a { color: #4f46e5; }
            .section-title { color: #4f46e5; border-bottom: 1pt solid #e0e7ff; padding-bottom: 2.5pt; }
            .record-title { color: #1e293b; font-weight: 700; }
            .record-sub { color: #475569; }
            li::marker { color: #4f46e5; }
            """

