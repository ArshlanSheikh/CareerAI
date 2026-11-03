import React, { useState } from 'react';
import Input from '../../../../components/common/Input/Input';
import Button from '../../../../components/common/Button/Button';
import Card from '../../../../components/common/Card/Card';
import { Plus, Trash2 } from 'lucide-react';
import s from './EditorSections.module.css';

export default function AdditionalInfoEditor({ data = {}, onChange }) {
  const [activeInputs, setActiveInputs] = useState({});

  const handleAdd = (field) => {
    const value = activeInputs[field]?.trim();
    if (!value) return;

    const currentList = data[field] || [];
    onChange({
      ...data,
      [field]: [...currentList, value],
    });
    setActiveInputs({ ...activeInputs, [field]: '' });
  };

  const handleRemove = (field, index) => {
    const currentList = data[field] || [];
    onChange({
      ...data,
      [field]: currentList.filter((_, idx) => idx !== index),
    });
  };

  const renderListGroup = (field, title, placeholder) => {
    const items = data[field] || [];
    return (
      <Card title={title} subtitle={`${items.length} items`} style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
          {items.map((item, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.45rem 0.75rem',
                backgroundColor: 'var(--color-bg-secondary)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
              }}
            >
              <span style={{ fontSize: '0.875rem', color: 'var(--color-text-primary)' }}>{item}</span>
              <button
                type="button"
                className={s.deleteIconBtn}
                onClick={() => handleRemove(field, idx)}
                title="Remove item"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          {items.length === 0 && (
            <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
              None added yet.
            </span>
          )}
        </div>

        <div className={s.quickAddRow} style={{ maxWidth: '440px' }}>
          <Input
            placeholder={placeholder}
            value={activeInputs[field] || ''}
            onChange={(e) => setActiveInputs({ ...activeInputs, [field]: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAdd(field);
              }
            }}
            style={{ marginBottom: 0, flex: 1 }}
          />
          <Button variant="secondary" size="sm" onClick={() => handleAdd(field)}>
            Add
          </Button>
        </div>
      </Card>
    );
  };

  return (
    <div>
      <div className={s.sectionHeader}>
        <div className={s.titleGroup}>
          <h3 className={s.sectionTitle}>Additional Accomplishments & Info</h3>
          <p className={s.sectionSubtitle}>
            Awards, hackathons, languages, leadership, and extracurricular honors that set you apart.
          </p>
        </div>
      </div>

      {renderListGroup('awards', 'Honors & Awards', 'e.g. 1st Place - University Hackathon 2024')}
      {renderListGroup('hackathons', 'Hackathons & Competitions', 'e.g. HackMIT Finalist (Top 10 of 200 teams)')}
      {renderListGroup('languages', 'Languages Spoken', 'e.g. English (Native), Spanish (Conversational)')}
      {renderListGroup('volunteer_experience', 'Volunteer & Community', 'e.g. Mentor at Girls Who Code')}
      {renderListGroup('publications', 'Publications & Whitepapers', 'e.g. Co-authored IEEE paper on Edge Computing')}
    </div>
  );
}
