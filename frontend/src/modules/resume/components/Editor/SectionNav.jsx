import React from 'react';
import styles from './SectionNav.module.css';
import {
  User,
  AlignLeft,
  GraduationCap,
  Code2,
  FolderGit2,
  Briefcase,
  Layers,
  Award,
  PlusSquare,
  Eye,
  EyeOff,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';

const SECTION_CONFIG = {
  summary: { label: 'Summary', icon: AlignLeft },
  education: { label: 'Education', icon: GraduationCap },
  skills: { label: 'Skills', icon: Code2 },
  projects: { label: 'Projects', icon: FolderGit2 },
  experience: { label: 'Experience', icon: Briefcase },
  internships: { label: 'Internships', icon: Layers },
  certifications: { label: 'Certifications', icon: Award },
  additional: { label: 'Additional', icon: PlusSquare },
};

export default function SectionNav({
  activeSection,
  onSelectSection,
  content = {},
  onReorder,
  onToggleVisibility,
}) {
  const sectionOrder = content?.section_order || [
    'summary',
    'education',
    'skills',
    'projects',
    'experience',
    'internships',
    'certifications',
    'additional',
  ];
  const hiddenSections = new Set(content?.hidden_sections || []);

  const getSectionCount = (key) => {
    switch (key) {
      case 'education':
        return content?.education?.length || 0;
      case 'skills':
        return (
          content?.skills?.reduce((acc, cat) => acc + (cat.items?.length || 0), 0) || 0
        );
      case 'projects':
        return content?.projects?.length || 0;
      case 'experience':
        return content?.work_experience?.length || 0;
      case 'internships':
        return content?.internships?.length || 0;
      case 'certifications':
        return content?.certifications?.length || 0;
      case 'summary':
        return content?.professional_summary?.content ? 1 : 0;
      case 'additional':
        const add = content?.additional_info || {};
        return (
          (add.awards?.length || 0) +
          (add.hackathons?.length || 0) +
          (add.languages?.length || 0) +
          (add.volunteer_experience?.length || 0)
        );
      default:
        return 0;
    }
  };

  const getSectionStatus = (key) => {
    switch (key) {
      case 'summary':
        const sum = content?.professional_summary?.content || '';
        if (!sum.trim()) return { label: 'Empty', type: 'warning' };
        if (sum.trim().split(/\s+/).length < 15) return { label: 'Brief', type: 'suggestion' };
        return { label: 'Ready', type: 'success' };
      case 'skills':
        const count = content?.skills?.reduce((acc, cat) => acc + (cat.items?.length || 0), 0) || 0;
        if (count === 0) return { label: 'Empty', type: 'warning' };
        if (count < 5) return { label: 'Add More', type: 'suggestion' };
        return { label: 'Good', type: 'success' };
      case 'projects':
        const projs = content?.projects || [];
        if (projs.length === 0) return { label: 'Empty', type: 'warning' };
        const hasBullets = projs.some(p => p.key_contributions?.length > 0 || p.personally_implemented_features?.length > 0);
        if (!hasBullets) return { label: 'Need Bullets', type: 'suggestion' };
        return { label: 'Good', type: 'success' };
      case 'experience':
        const exps = content?.work_experience || [];
        if (exps.length === 0) return null;
        const expBullets = exps.some(e => e.responsibilities?.length > 0);
        if (!expBullets) return { label: 'Need Bullets', type: 'suggestion' };
        return { label: 'Good', type: 'success' };
      default:
        return null;
    }
  };

  return (
    <aside className={styles.navContainer}>
      <div className={styles.navHeader}>Resume Sections</div>

      {/* Personal Info is always fixed at top */}
      <div
        className={`${styles.navItem} ${activeSection === 'personal' ? styles.activeItem : ''}`}
        onClick={() => onSelectSection('personal')}
      >
        <div className={styles.itemMain}>
          <User size={16} />
          <span className={`${styles.itemLabel} ${activeSection === 'personal' ? styles.activeLabel : ''}`}>
            Personal Information
          </span>
        </div>
      </div>

      {/* Reorderable & Toggable Sections */}
      {sectionOrder.map((sectionKey, index) => {
        const config = SECTION_CONFIG[sectionKey] || { label: sectionKey, icon: Layers };
        const Icon = config.icon;
        const isHidden = hiddenSections.has(sectionKey);
        const isActive = activeSection === sectionKey;
        const count = getSectionCount(sectionKey);
        const status = getSectionStatus(sectionKey);

        return (
          <div
            key={sectionKey}
            className={`${styles.navItem} ${isActive ? styles.activeItem : ''} ${
              isHidden ? styles.hiddenItem : ''
            }`}
            onClick={() => onSelectSection(sectionKey)}
          >
            <div className={styles.itemMain}>
              <Icon size={16} />
              <span className={`${styles.itemLabel} ${isActive ? styles.activeLabel : ''}`}>
                {config.label}
              </span>
              {count > 0 && (
                <span className={`${styles.countBadge} ${isActive ? styles.activeBadge : ''}`}>
                  {count}
                </span>
              )}
              {status && (
                <span className={`${styles.statusPill} ${styles[`status_${status.type}`]}`}>
                  {status.label}
                </span>
              )}
            </div>

            <div className={styles.itemControls} onClick={(e) => e.stopPropagation()}>
              {/* Move Up */}
              <button
                type="button"
                className={styles.controlBtn}
                title="Move section up"
                disabled={index === 0}
                onClick={() => onReorder(sectionKey, 'up')}
              >
                <ChevronUp size={14} />
              </button>

              {/* Move Down */}
              <button
                type="button"
                className={styles.controlBtn}
                title="Move section down"
                disabled={index === sectionOrder.length - 1}
                onClick={() => onReorder(sectionKey, 'down')}
              >
                <ChevronDown size={14} />
              </button>

              {/* Toggle Visibility */}
              <button
                type="button"
                className={styles.controlBtn}
                title={isHidden ? 'Show section in resume' : 'Hide section from resume'}
                onClick={() => onToggleVisibility(sectionKey)}
              >
                {isHidden ? (
                  <EyeOff size={14} className={styles.hiddenIcon} />
                ) : (
                  <Eye size={14} className={styles.visibleIcon} />
                )}
              </button>
            </div>
          </div>
        );
      })}
    </aside>
  );
}

