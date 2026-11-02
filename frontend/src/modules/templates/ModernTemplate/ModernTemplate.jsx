import React from 'react';
import styles from './ModernTemplate.module.css';

export default function ModernTemplate({ content = {}, targetRole = '' }) {
  const pInfo = content.personal_info || {};
  const summary = content.professional_summary || {};
  const education = content.education || [];
  const skills = content.skills || [];
  const projects = content.projects || [];
  const experience = content.work_experience || [];
  const internships = content.internships || [];
  const certs = content.certifications || [];
  const addInfo = content.additional_info || {};

  const sectionOrder = content.section_order || [
    'summary',
    'education',
    'skills',
    'projects',
    'experience',
    'internships',
    'certifications',
    'additional',
  ];
  const hidden = new Set(content.hidden_sections || []);

  const contactList = [
    pInfo.email && { label: pInfo.email, href: `mailto:${pInfo.email}` },
    pInfo.phone && { label: pInfo.phone, href: `tel:${pInfo.phone}` },
    (pInfo.city || pInfo.state || pInfo.country) && {
      label: [pInfo.city, pInfo.state, pInfo.country].filter(Boolean).join(', '),
    },
    pInfo.linkedin_url && { label: 'LinkedIn', href: pInfo.linkedin_url },
    pInfo.github_url && { label: 'GitHub', href: pInfo.github_url },
    pInfo.portfolio_url && { label: 'Portfolio', href: pInfo.portfolio_url },
  ].filter(Boolean);

  const renderSection = (key) => {
    if (hidden.has(key)) return null;

    switch (key) {
      case 'summary':
        if (!summary.content) return null;
        return (
          <section key="summary" className={styles.section}>
            <h2 className={styles.sectionTitle}>Professional Summary</h2>
            <p className={styles.summaryText}>{summary.content}</p>
          </section>
        );

      case 'education':
        if (!education.length) return null;
        return (
          <section key="education" className={styles.section}>
            <h2 className={styles.sectionTitle}>Education</h2>
            {education.map((edu, idx) => (
              <div key={edu.id || idx} className={styles.itemBlock}>
                <div className={styles.rowBetween}>
                  <span className={styles.primaryTitle}>{edu.institution || 'University'}</span>
                  <span className={styles.dateRange}>
                    {edu.start_year && edu.end_year ? `${edu.start_year} – ${edu.end_year}` : edu.end_year}
                  </span>
                </div>
                <div className={styles.rowBetween}>
                  <span className={styles.subTitle}>
                    {edu.degree} {edu.field_of_study ? `in ${edu.field_of_study}` : ''}
                  </span>
                  {edu.grade && (
                    <span className={styles.dateRange}>
                      {edu.grade_type}: {edu.grade}
                    </span>
                  )}
                </div>
                {edu.description && <p className={styles.tagline}>{edu.description}</p>}
              </div>
            ))}
          </section>
        );

      case 'skills':
        if (!skills.length || !skills.some((s) => s.items?.length)) return null;
        return (
          <section key="skills" className={styles.section}>
            <h2 className={styles.sectionTitle}>Technical Skills</h2>
            <div className={styles.skillsContainer}>
              {skills.map((cat, idx) => (
                <div key={cat.id || idx} className={styles.skillLine}>
                  <span className={styles.skillCategory}>{cat.category}: </span>
                  <span className={styles.skillItems}>{(cat.items || []).join(', ')}</span>
                </div>
              ))}
            </div>
          </section>
        );

      case 'projects':
        if (!projects.length) return null;
        return (
          <section key="projects" className={styles.section}>
            <h2 className={styles.sectionTitle}>Projects</h2>
            {projects.map((proj, idx) => (
              <div key={proj.id || idx} className={styles.itemBlock}>
                <div className={styles.rowBetween}>
                  <span className={styles.primaryTitle}>
                    {proj.name}
                    {proj.role ? ` — ${proj.role}` : ''}
                  </span>
                  <span className={styles.dateRange}>
                    {proj.start_date && proj.end_date ? `${proj.start_date} – ${proj.end_date}` : proj.end_date}
                  </span>
                </div>
                {proj.technologies?.length > 0 && (
                  <div className={styles.techStack}>
                    Technologies: {proj.technologies.join(', ')}
                  </div>
                )}
                {proj.description && <p className={styles.tagline}>{proj.description}</p>}
                {proj.personally_implemented_features?.filter(Boolean).length > 0 && (
                  <ul className={styles.bulletList}>
                    {proj.personally_implemented_features.filter(Boolean).map((b, bIdx) => (
                      <li key={bIdx} className={styles.bulletItem}>{b}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </section>
        );

      case 'experience':
        if (!experience.length) return null;
        return (
          <section key="experience" className={styles.section}>
            <h2 className={styles.sectionTitle}>Work Experience</h2>
            {experience.map((exp, idx) => (
              <div key={exp.id || idx} className={styles.itemBlock}>
                <div className={styles.rowBetween}>
                  <span className={styles.primaryTitle}>{exp.job_title}</span>
                  <span className={styles.dateRange}>
                    {exp.start_date && (exp.end_date || exp.is_current)
                      ? `${exp.start_date} – ${exp.is_current ? 'Present' : exp.end_date}`
                      : exp.start_date}
                  </span>
                </div>
                <div className={styles.rowBetween}>
                  <span className={styles.subTitle}>{exp.company_name}</span>
                  {exp.location && <span className={styles.dateRange}>{exp.location}</span>}
                </div>
                {exp.responsibilities?.filter(Boolean).length > 0 && (
                  <ul className={styles.bulletList}>
                    {exp.responsibilities.filter(Boolean).map((b, bIdx) => (
                      <li key={bIdx} className={styles.bulletItem}>{b}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </section>
        );

      case 'internships':
        if (!internships.length) return null;
        return (
          <section key="internships" className={styles.section}>
            <h2 className={styles.sectionTitle}>Internships</h2>
            {internships.map((intn, idx) => (
              <div key={intn.id || idx} className={styles.itemBlock}>
                <div className={styles.rowBetween}>
                  <span className={styles.primaryTitle}>{intn.position}</span>
                  <span className={styles.dateRange}>{intn.start_date} – {intn.end_date}</span>
                </div>
                <div className={styles.subTitle}>{intn.organization}</div>
                {intn.responsibilities?.filter(Boolean).length > 0 && (
                  <ul className={styles.bulletList}>
                    {intn.responsibilities.filter(Boolean).map((b, bIdx) => (
                      <li key={bIdx} className={styles.bulletItem}>{b}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </section>
        );

      case 'certifications':
        if (!certs.length) return null;
        return (
          <section key="certifications" className={styles.section}>
            <h2 className={styles.sectionTitle}>Certifications</h2>
            {certs.map((c, idx) => (
              <div key={c.id || idx} className={styles.rowBetween} style={{ marginBottom: '0.35rem' }}>
                <span className={styles.primaryTitle}>
                  {c.certification_name} {c.issuing_organization ? `— ${c.issuing_organization}` : ''}
                </span>
                <span className={styles.dateRange}>{c.issue_date}</span>
              </div>
            ))}
          </section>
        );

      case 'additional':
        const awards = addInfo.awards || [];
        const hacks = addInfo.hackathons || [];
        const langs = addInfo.languages || [];
        const vols = addInfo.volunteer_experience || [];
        if (!awards.length && !hacks.length && !langs.length && !vols.length) return null;
        return (
          <section key="additional" className={styles.section}>
            <h2 className={styles.sectionTitle}>Additional Accomplishments</h2>
            {awards.length > 0 && (
              <div className={styles.skillLine} style={{ marginBottom: '0.25rem' }}>
                <span className={styles.skillCategory}>Awards & Honors: </span>
                <span>{awards.join(' • ')}</span>
              </div>
            )}
            {hacks.length > 0 && (
              <div className={styles.skillLine} style={{ marginBottom: '0.25rem' }}>
                <span className={styles.skillCategory}>Hackathons & Competitions: </span>
                <span>{hacks.join(' • ')}</span>
              </div>
            )}
            {langs.length > 0 && (
              <div className={styles.skillLine} style={{ marginBottom: '0.25rem' }}>
                <span className={styles.skillCategory}>Languages: </span>
                <span>{langs.join(', ')}</span>
              </div>
            )}
            {vols.length > 0 && (
              <div className={styles.skillLine}>
                <span className={styles.skillCategory}>Volunteer Experience: </span>
                <span>{vols.join(' • ')}</span>
              </div>
            )}
          </section>
        );

      default:
        return null;
    }
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <h1 className={styles.name}>{pInfo.full_name || 'Your Full Name'}</h1>
        <div className={styles.role}>{targetRole || summary.target_role || 'Target Professional Role'}</div>
        <div className={styles.contactRow}>
          {contactList.map((item, index) => (
            <React.Fragment key={index}>
              {index > 0 && <span className={styles.separator}>•</span>}
              <span className={styles.contactItem}>
                {item.href ? (
                  <a href={item.href} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit' }}>
                    {item.label}
                  </a>
                ) : (
                  item.label
                )}
              </span>
            </React.Fragment>
          ))}
        </div>
      </header>

      {/* Sections in user-defined order */}
      {sectionOrder.map((key) => renderSection(key))}
    </div>
  );
}

