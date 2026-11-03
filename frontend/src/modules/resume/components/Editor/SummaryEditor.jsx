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

      <div style={{
        marginTop: '1rem',
        padding: '0.75rem 1rem',
        borderRadius: 'var(--radius-lg)',
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.06) 0%, rgba(168, 85, 247, 0.06) 100%)',
        border: '1px solid rgba(99, 102, 241, 0.15)',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.6rem',
        fontSize: '0.8rem',
        color: 'var(--slate-700)',
      }}>
        <Sparkles size={16} color="var(--primary-600)" style={{ flexShrink: 0, marginTop: '2px' }} />
        <div>
          <strong>ATS Keyword Tip:</strong> Tailor your summary to your target role by including 2 core technical competencies (e.g. "React & TypeScript") and stating your tangible project contributions.
        </div>
      </div>
    </div>
  );
}
