import React from 'react';
import Input from '../../../../components/common/Input/Input';
import Button from '../../../../components/common/Button/Button';
import { Sparkles } from 'lucide-react';

export default function SummaryEditor({ data = {}, onChange, onTriggerAi }) {
  const handleChange = (field, value) => {
    onChange({
      ...data,
      [field]: value,
    });
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
        <div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--slate-900)' }}>
            Professional Summary
          </h3>
          <p style={{ fontSize: '0.8125rem', color: 'var(--slate-500)' }}>
            A concise 2-4 sentence career overview highlighting your key qualifications and target role.
          </p>
        </div>

        {onTriggerAi && (
          <Button
            variant="outline"
            size="sm"
            icon={Sparkles}
            onClick={onTriggerAi}
            style={{ color: 'var(--primary-600)', borderColor: 'var(--primary-300)' }}
          >
            AI Summary Assist
          </Button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
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

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
        <label style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--slate-700)' }}>
          Summary Content
        </label>
        <textarea
          rows={6}
          value={data.content || ''}
          onChange={(e) => handleChange('content', e.target.value)}
          placeholder="Motivated Computer Science graduate with strong foundational knowledge in React, Python, and scalable web architectures. Proven ability to build full-stack projects..."
          style={{
            width: '100%',
            padding: '0.75rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--slate-300)',
            fontSize: '0.875rem',
            lineHeight: 1.5,
            color: 'var(--slate-900)',
            outline: 'none',
            resize: 'vertical',
            fontFamily: 'inherit',
          }}
        />
        <span style={{ fontSize: '0.75rem', color: 'var(--slate-400)', textAlign: 'right' }}>
          {(data.content || '').split(/\s+/).filter(Boolean).length} words
        </span>
      </div>
    </div>
  );
}

