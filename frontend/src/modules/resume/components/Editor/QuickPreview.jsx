import React from 'react';
import styles from './QuickPreview.module.css';
import TemplateRenderer from '../../../templates/TemplateRenderer';

export default function QuickPreview({ content = {}, template = 'modern', targetRole = '' }) {
  return (
    <div className={styles.previewWrapper}>
      <div className={styles.previewHeader}>
        <span className={styles.previewTitle}>Live Preview ({template})</span>
      </div>

      <div className={styles.paperSheet} style={{ padding: 0 }}>
        <TemplateRenderer content={content} template={template} targetRole={targetRole} />
      </div>
    </div>
  );
}
