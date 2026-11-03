import React from 'react';
import Input from '../../../../components/common/Input/Input';
import Button from '../../../../components/common/Button/Button';
import Card from '../../../../components/common/Card/Card';
import { Plus, Trash2, Layers, Sparkles } from 'lucide-react';
import s from './EditorSections.module.css';

export default function InternshipsEditor({ list = [], onChange, onTriggerAi }) {
  const handleAdd = () => {
    const newRecord = {
      id: `INT_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      organization: '',
      position: '',
      start_date: '',
      end_date: '',
      responsibilities: [''],
      skills_learned: [],
      projects_completed: [],
    };
    onChange([...list, newRecord]);
  };

  const handleUpdate = (index, field, value) => {
    const updated = [...list];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const handleRemove = (index) => {
    onChange(list.filter((_, idx) => idx !== index));
  };

  const handleBulletChange = (intIndex, bIndex, value) => {
    const updated = [...list];
    const bullets = [...(updated[intIndex].responsibilities || [])];
    bullets[bIndex] = value;
    updated[intIndex].responsibilities = bullets;
    onChange(updated);
  };

  const handleAddBullet = (intIndex) => {
    const updated = [...list];
    updated[intIndex].responsibilities = [...(updated[intIndex].responsibilities || []), ''];
    onChange(updated);
  };

  const handleRemoveBullet = (intIndex, bIndex) => {
    const updated = [...list];
    updated[intIndex].responsibilities = (updated[intIndex].responsibilities || []).filter((_, idx) => idx !== bIndex);
    onChange(updated);
  };

  return (
    <div>
      <div className={s.sectionHeader}>
        <div className={s.titleGroup}>
          <h3 className={s.sectionTitle}>Internships & Fellowships</h3>
          <p className={s.sectionSubtitle}>
            Highlight summer internships, research fellowships, or co-op training programs.
          </p>
        </div>
        <Button variant="primary" size="sm" icon={Plus} onClick={handleAdd}>
          Add Internship
        </Button>
      </div>

      {list.length === 0 ? (
        <div className={s.emptyStateCard}>
          <div className={s.emptyIconCircle}>
            <Layers size={24} />
          </div>
          <p className={s.emptyStateText}>No internship records added yet.</p>
          <Button variant="outline" size="sm" icon={Plus} onClick={handleAdd} style={{ marginTop: '0.5rem' }}>
            Add Your Internship
          </Button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {list.map((item, intIndex) => (
            <Card
              key={item.id || intIndex}
              title={item.position ? `${item.position} at ${item.organization || 'Organization'}` : `Internship #${intIndex + 1}`}
              subtitle={item.start_date ? `${item.start_date} – ${item.end_date || 'Present'}` : ''}
              actions={
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  {onTriggerAi && (
                    <button
                      type="button"
                      className={s.aiAssistBtn}
                      onClick={() => onTriggerAi(intIndex, item)}
                      title="Refine bullets with Gemini AI"
                      style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
                    >
                      <Sparkles size={13} />
                      <span>AI Assist</span>
                    </button>
                  )}
                  <button
                    type="button"
                    className={s.deleteIconBtn}
                    onClick={() => handleRemove(intIndex)}
                    title="Remove internship"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              }
            >
              <div className={s.gridTwoCol}>
                <Input
                  label="Position / Title"
                  value={item.position || ''}
                  onChange={(e) => handleUpdate(intIndex, 'position', e.target.value)}
                  placeholder="e.g. Frontend Development Intern"
                  required
                />

                <Input
                  label="Organization / Company"
                  value={item.organization || ''}
                  onChange={(e) => handleUpdate(intIndex, 'organization', e.target.value)}
                  placeholder="e.g. Microsoft / Research Lab"
                  required
                />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <Input
                    label="Start Date"
                    value={item.start_date || ''}
                    onChange={(e) => handleUpdate(intIndex, 'start_date', e.target.value)}
                    placeholder="05/2023"
                  />
                  <Input
                    label="End Date"
                    value={item.end_date || ''}
                    onChange={(e) => handleUpdate(intIndex, 'end_date', e.target.value)}
                    placeholder="08/2023"
                  />
                </div>
              </div>

              {/* Responsibilities bullets */}
              <div style={{ marginTop: '0.75rem', marginBottom: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <label className={s.textareaLabel}>
                    Responsibilities & Deliverables
                  </label>
                  <button
                    type="button"
                    className={s.addBulletBtn}
                    onClick={() => handleAddBullet(intIndex)}
                  >
                    <Plus size={13} />
                    <span>Add Bullet</span>
                  </button>
                </div>
                <div className={s.bulletsContainer}>
                  {item.responsibilities?.map((bullet, bIdx) => (
                    <div key={bIdx} className={s.bulletRow}>
                      <span className={s.bulletDot} />
                      <input
                        className={s.bulletInput}
                        value={bullet}
                        onChange={(e) => handleBulletChange(intIndex, bIdx, e.target.value)}
                        placeholder="e.g. Collaborated with senior engineers to implement WCAG 2.1 accessibility standards"
                      />
                      <button
                        type="button"
                        className={s.deleteIconBtn}
                        onClick={() => handleRemoveBullet(intIndex, bIdx)}
                        title="Remove bullet"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
