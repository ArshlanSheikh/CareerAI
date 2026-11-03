import React, { useState } from 'react';
import Button from '../../../../components/common/Button/Button';
import Card from '../../../../components/common/Card/Card';
import Input from '../../../../components/common/Input/Input';
import { Plus, Trash2, X, Code2, Sparkles } from 'lucide-react';
import s from './EditorSections.module.css';

export default function SkillsEditor({ list = [], onChange, onTriggerAi }) {
  const [newCatName, setNewCatName] = useState('');
  const [skillInputs, setSkillInputs] = useState({});

  const handleAddCategory = () => {
    if (!newCatName.trim()) return;
    const newCategory = {
      id: `SKILL_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      category: newCatName.trim(),
      items: [],
    };
    onChange([...list, newCategory]);
    setNewCatName('');
  };

  const handleRemoveCategory = (catIndex) => {
    onChange(list.filter((_, idx) => idx !== catIndex));
  };

  const handleAddSkill = (catIndex) => {
    const skillName = skillInputs[catIndex]?.trim();
    if (!skillName) return;

    const updated = [...list];
    if (!updated[catIndex].items.includes(skillName)) {
      updated[catIndex] = {
        ...updated[catIndex],
        items: [...updated[catIndex].items, skillName],
      };
      onChange(updated);
    }
    setSkillInputs({ ...skillInputs, [catIndex]: '' });
  };

  const handleRemoveSkill = (catIndex, skillIndex) => {
    const updated = [...list];
    updated[catIndex] = {
      ...updated[catIndex],
      items: updated[catIndex].items.filter((_, idx) => idx !== skillIndex),
    };
    onChange(updated);
  };

  return (
    <div>
      <div className={s.sectionHeader}>
        <div className={s.titleGroup}>
          <h3 className={s.sectionTitle}>Technical Skills</h3>
          <p className={s.sectionSubtitle}>
            Categorize your technical proficiency into dynamic groups (Languages, Frameworks, Cloud, Databases).
          </p>
        </div>

        {onTriggerAi && (
          <button
            type="button"
            className={s.aiAssistBtn}
            onClick={onTriggerAi}
            title="AI suggest relevant skills based on your profile"
          >
            <Sparkles size={15} />
            <span>AI Suggest Skills</span>
          </button>
        )}
      </div>

      {/* Add New Category Row */}
      <div className={s.quickAddRow} style={{ marginBottom: '1.5rem', maxWidth: '480px' }}>
        <Input
          placeholder="New Category (e.g. Cloud & DevOps)"
          value={newCatName}
          onChange={(e) => setNewCatName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleAddCategory();
            }
          }}
          style={{ marginBottom: 0, flex: 1 }}
        />
        <Button variant="primary" size="md" icon={Plus} onClick={handleAddCategory}>
          Add Category
        </Button>
      </div>

      {list.length === 0 ? (
        <div className={s.emptyStateCard}>
          <div className={s.emptyIconCircle}>
            <Code2 size={24} />
          </div>
          <p className={s.emptyStateText}>No skill categories added yet.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {list.map((cat, catIndex) => (
            <Card
              key={cat.id || catIndex}
              title={cat.category}
              subtitle={`${cat.items?.length || 0} skills added`}
              actions={
                <button
                  type="button"
                  className={s.deleteIconBtn}
                  onClick={() => handleRemoveCategory(catIndex)}
                  title="Remove category"
                >
                  <Trash2 size={16} />
                </button>
              }
            >
              {/* Skill chips list */}
              <div className={s.tagsContainer} style={{ marginBottom: '1rem' }}>
                {cat.items?.map((skill, skillIndex) => (
                  <span key={skillIndex} className={s.tagPill}>
                    <span>{skill}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(catIndex, skillIndex)}
                      className={s.tagRemoveBtn}
                      aria-label={`Remove ${skill}`}
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
                {(!cat.items || cat.items.length === 0) && (
                  <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                    No skills in this category yet.
                  </span>
                )}
              </div>

              {/* Add Skill Input */}
              <div className={s.quickAddRow} style={{ maxWidth: '380px' }}>
                <Input
                  placeholder={`Add skill to ${cat.category}...`}
                  value={skillInputs[catIndex] || ''}
                  onChange={(e) => setSkillInputs({ ...skillInputs, [catIndex]: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSkill(catIndex);
                    }
                  }}
                  style={{ marginBottom: 0, flex: 1 }}
                />
                <Button variant="secondary" size="sm" onClick={() => handleAddSkill(catIndex)}>
                  Add
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
