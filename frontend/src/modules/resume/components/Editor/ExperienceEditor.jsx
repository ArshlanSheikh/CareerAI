import React from 'react';
import Input from '../../../../components/common/Input/Input';
import Button from '../../../../components/common/Button/Button';
import Card from '../../../../components/common/Card/Card';
import { Plus, Trash2, Briefcase, Sparkles } from 'lucide-react';
import s from './EditorSections.module.css';

export default function ExperienceEditor({ list = [], onChange, onTriggerAi }) {
  const handleAdd = () => {
    const newRecord = {
      id: `EXP_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      company_name: '',
      job_title: '',
      employment_type: 'Full-time',
      location: '',
      start_date: '',
      end_date: '',
      is_current: false,
      responsibilities: [''],
      achievements: [''],
      technologies: [],
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

  const handleBulletChange = (expIndex, field, bIndex, value) => {
    const updated = [...list];
    const bullets = [...(updated[expIndex][field] || [])];
    bullets[bIndex] = value;
    updated[expIndex][field] = bullets;
    onChange(updated);
  };

  const handleAddBullet = (expIndex, field) => {
    const updated = [...list];
    updated[expIndex][field] = [...(updated[expIndex][field] || []), ''];
    onChange(updated);
  };

  const handleRemoveBullet = (expIndex, field, bIndex) => {
    const updated = [...list];
    updated[expIndex][field] = (updated[expIndex][field] || []).filter((_, idx) => idx !== bIndex);
    onChange(updated);
  };

  return (
    <div>
      <div className={s.sectionHeader}>
        <div className={s.titleGroup}>
          <h3 className={s.sectionTitle}>Work Experience</h3>
          <p className={s.sectionSubtitle}>
            Add full-time, part-time, or contract professional employment history.
          </p>
        </div>
        <Button variant="primary" size="sm" icon={Plus} onClick={handleAdd}>
          Add Experience
        </Button>
      </div>

      {list.length === 0 ? (
        <div className={s.emptyStateCard}>
          <div className={s.emptyIconCircle}>
            <Briefcase size={24} />
          </div>
          <p className={s.emptyStateText}>No professional experience records added yet.</p>
          <Button variant="outline" size="sm" icon={Plus} onClick={handleAdd} style={{ marginTop: '0.5rem' }}>
            Add Work Experience
          </Button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {list.map((exp, expIndex) => (
            <Card
              key={exp.id || expIndex}
              title={exp.job_title ? `${exp.job_title} at ${exp.company_name || 'Company'}` : `Experience #${expIndex + 1}`}
              subtitle={exp.location || 'Location'}
              actions={
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  {onTriggerAi && (
                    <button
                      type="button"
                      className={s.aiAssistBtn}
                      onClick={() => onTriggerAi(expIndex, exp)}
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
                    onClick={() => handleRemove(expIndex)}
                    title="Remove experience"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              }
            >
              <div className={s.gridTwoCol}>
                <Input
                  label="Job Title"
                  value={exp.job_title || ''}
                  onChange={(e) => handleUpdate(expIndex, 'job_title', e.target.value)}
                  placeholder="e.g. Associate Software Engineer"
                  required
                />

                <Input
                  label="Company Name"
                  value={exp.company_name || ''}
                  onChange={(e) => handleUpdate(expIndex, 'company_name', e.target.value)}
                  placeholder="e.g. Stripe, Amazon, Start-up"
                  required
                />

                <Input
                  label="Location"
                  value={exp.location || ''}
                  onChange={(e) => handleUpdate(expIndex, 'location', e.target.value)}
                  placeholder="e.g. Seattle, WA / Remote"
                />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <Input
                    label="Start Date"
                    value={exp.start_date || ''}
                    onChange={(e) => handleUpdate(expIndex, 'start_date', e.target.value)}
                    placeholder="06/2023"
                  />
                  <Input
                    label="End Date"
                    value={exp.end_date || ''}
                    onChange={(e) => handleUpdate(expIndex, 'end_date', e.target.value)}
                    placeholder={exp.is_current ? 'Present' : '01/2024'}
                    disabled={exp.is_current}
                  />
                </div>
              </div>

              {/* Responsibilities bullets */}
              <div style={{ marginTop: '0.75rem', marginBottom: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <label className={s.textareaLabel}>
                    Key Responsibilities & Bullet Points
                  </label>
                  <button
                    type="button"
                    className={s.addBulletBtn}
                    onClick={() => handleAddBullet(expIndex, 'responsibilities')}
                  >
                    <Plus size={13} />
                    <span>Add Bullet</span>
                  </button>
                </div>
                <div className={s.bulletsContainer}>
                  {exp.responsibilities?.map((bullet, bIdx) => (
                    <div key={bIdx} className={s.bulletRow}>
                      <span className={s.bulletDot} />
                      <input
                        className={s.bulletInput}
                        value={bullet}
                        onChange={(e) => handleBulletChange(expIndex, 'responsibilities', bIdx, e.target.value)}
                        placeholder="e.g. Engineered distributed event queue handling 5M daily webhook deliveries"
                      />
                      <button
                        type="button"
                        className={s.deleteIconBtn}
                        onClick={() => handleRemoveBullet(expIndex, 'responsibilities', bIdx)}
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
