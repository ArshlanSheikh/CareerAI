import React from 'react';
import Input from '../../../../components/common/Input/Input';
import Button from '../../../../components/common/Button/Button';
import { Sparkles } from 'lucide-react';
import s from './EditorSections.module.css';

export default function SummaryEditor({ data = {}, onChange, onTriggerAi }) {
  const handleChange = (field, value) => {
    onChange({
      ...data,
      [field]: value,
    });
  };

  const wordCount = (data.content || '').split(/\s+/).filter(Boolean).length;

  return (
    <div>
      <div className={s.sectionHeader}>
        <div className={s.titleGroup}>
          <h3 className={s.sectionTitle}>Professional Summary</h3>
          <p className={s.sectionSubtitle}>
            A concise 2-4 sentence career overview highlighting your key qualifications and target role.
          </p>
        </div>

        {onTriggerAi && (
          <button
            type="button"
            className={s.aiAssistBtn}
            onClick={onTriggerAi}
            title="Refine or generate with Gemini AI"
          >
            <Sparkles size={15} />
            <span>AI Summary Assist</span>
          </button>
        )}
      </div>

      <div className={s.gridTwoCol} style={{ marginBottom: '1.25rem' }}>
        <Input
          label="Target Role"
          value={data.target_role || ''}
          onChange={(e) => handleChange('target_role', e.target.value)}
          placeholder="e.g. Software Engineer, Frontend Developer"
        />

        <Input
          label="Experience Level"
          value={data.experience_level || 'Entry Level / Student'}
          onChange={(e) => handleChange('experience_level', e.target.value)}
          placeholder="e.g. Entry Level, Fresher, Internship"
        />
      </div>

      <div className={s.textareaGroup}>
        <div className={s.textareaHeader}>
          <label className={s.textareaLabel}>Summary Content</label>
          <span className={s.wordCountBadge}>{wordCount} words</span>
        </div>
        <textarea
          rows={6}
          value={data.content || ''}
          onChange={(e) => handleChange('content', e.target.value)}
          placeholder="Motivated Computer Science student with strong foundational skills in full-stack web development, Python, and modern cloud architectures. Eager to contribute to high-impact engineering teams..."
          className={s.textarea}
        />
      </div>
    </div>
  );
}
