import React, { useState } from 'react';
import Button from '../../../../components/common/Button/Button';
import Card from '../../../../components/common/Card/Card';
import Input from '../../../../components/common/Input/Input';
import { Plus, Trash2, X, Code2, Sparkles } from 'lucide-react';

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
        <div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--slate-900)' }}>
            Technical Skills
          </h3>
          <p style={{ fontSize: '0.8125rem', color: 'var(--slate-500)' }}>
            Categorize your technical proficiency into dynamic groups (Languages, Frameworks, Cloud, Databases).
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
            AI Suggest Skills
          </Button>
        )}
      </div>

      {/* Add New Category Row */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', maxWidth: '480px' }}>
        <Input
          placeholder="New Category (e.g. Cloud & DevOps)"
          value={newCatName}
          onChange={(e) => setNewCatName(e.target.value)}
          style={{ marginBottom: 0, flex: 1 }}
        />
        <Button variant="primary" size="md" icon={Plus} onClick={handleAddCategory}>
          Add Category
        </Button>
      </div>

      {list.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', border: '1px dashed var(--slate-300)', borderRadius: 'var(--radius-lg)', color: 'var(--slate-500)' }}>
          <Code2 size={32} style={{ margin: '0 auto 0.5rem', opacity: 0.6 }} />
          <p style={{ fontSize: '0.875rem' }}>No skill categories added yet.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {list.map((cat, catIndex) => (
            <Card
              key={cat.id || catIndex}
              title={cat.category}
              subtitle={`${cat.items?.length || 0} skills added`}
              actions={
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveCategory(catIndex)}
                  title="Remove category"
                  style={{ color: 'var(--danger-600)' }}
                >
                  <Trash2 size={16} />
                </Button>
              }
            >
              {/* Skill chips list */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1rem' }}>
                {cat.items?.map((skill, skillIndex) => (
                  <span
                    key={skillIndex}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: '0.25rem 0.6rem',
                      backgroundColor: 'var(--primary-50)',
                      color: 'var(--primary-700)',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '0.8125rem',
                      fontWeight: 500,
                      border: '1px solid var(--primary-200)',
                    }}
                  >
                    <span>{skill}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(catIndex, skillIndex)}
                      style={{ cursor: 'pointer', display: 'flex', color: 'var(--primary-500)' }}
                      aria-label={`Remove ${skill}`}
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
                {(!cat.items || cat.items.length === 0) && (
                  <span style={{ fontSize: '0.8125rem', color: 'var(--slate-400)', fontStyle: 'italic' }}>
                    No skills in this category yet.
                  </span>
                )}
              </div>

              {/* Add Skill Input */}
              <div style={{ display: 'flex', gap: '0.5rem', maxWidth: '380px' }}>
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

