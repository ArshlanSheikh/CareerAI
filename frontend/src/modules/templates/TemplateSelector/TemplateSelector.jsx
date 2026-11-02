import React from 'react';
import styles from './TemplateSelector.module.css';
import { CheckCircle2, LayoutTemplate } from 'lucide-react';

const TEMPLATE_OPTIONS = [
  {
    id: 'modern',
    name: 'Modern Professional',
    tag: 'Best for Tech & Startups',
    desc: 'Contemporary layout with balanced hierarchy, indigo accents, and clean typography.',
  },
  {
    id: 'ats',
    name: 'Minimal ATS-Friendly',
    tag: '100% ATS Optimized',
    desc: 'Single-column structure without graphics, ideal for automated resume scanners.',
  },
  {
    id: 'traditional',
    name: 'Traditional Professional',
    tag: 'Corporate & Academia',
    desc: 'Classic serif typography, formal horizontal rules, and balanced academic styling.',
  },
];

export default function TemplateSelector({ selectedTemplate = 'modern', onSelectTemplate }) {
  return (
    <div className={styles.selectorContainer}>
      <div className={styles.cardsGrid}>
        {TEMPLATE_OPTIONS.map((tmpl) => {
          const isSelected = selectedTemplate === tmpl.id;
          return (
            <div
              key={tmpl.id}
              className={`${styles.templateCard} ${isSelected ? styles.selected : ''}`}
              onClick={() => onSelectTemplate(tmpl.id)}
            >
              {isSelected && <CheckCircle2 size={18} className={styles.checkIndicator} />}
              <span className={`${styles.tagBadge} ${isSelected ? styles.selectedTag : ''}`}>
                {tmpl.tag}
              </span>
              <h4 className={styles.templateTitle}>{tmpl.name}</h4>
              <p className={styles.templateDesc}>{tmpl.desc}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

