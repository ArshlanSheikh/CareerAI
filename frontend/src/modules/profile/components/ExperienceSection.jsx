import React from 'react';
import Input from '../../../components/common/Input/Input';
import Button from '../../../components/common/Button/Button';
import Card from '../../../components/common/Card/Card';
import { Plus, Trash2, Briefcase } from 'lucide-react';

export default function ExperienceSection({ list = [], onChange }) {
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--slate-900)' }}>
            Work & Professional Experience
          </h3>
          <p style={{ fontSize: '0.8125rem', color: 'var(--slate-500)' }}>
            Record past internships, part-time jobs, freelance, or full-time roles.
          </p>
        </div>
        <Button variant="outline" size="sm" icon={Plus} onClick={handleAdd}>
          Add Experience
        </Button>
      </div>

      {list.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', border: '1px dashed var(--slate-300)', borderRadius: 'var(--radius-lg)', color: 'var(--slate-500)' }}>
          <Briefcase size={32} style={{ margin: '0 auto 0.5rem', opacity: 0.6 }} />
          <p style={{ fontSize: '0.875rem' }}>No work experience added yet.</p>
          <Button variant="secondary" size="sm" icon={Plus} onClick={handleAdd} style={{ marginTop: '0.75rem' }}>
            Add Work Experience / Internship
          </Button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {list.map((exp, expIndex) => (
            <Card
              key={exp.id || expIndex}
              title={exp.job_title ? `${exp.job_title} at ${exp.company_name || 'Company'}` : `Experience #${expIndex + 1}`}
              subtitle={exp.location || 'Location'}
              actions={
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemove(expIndex)}
                  title="Remove experience"
                  style={{ color: 'var(--danger-600)' }}
                >
                  <Trash2 size={16} />
                </Button>
              }
            >
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                <Input
                  label="Job Title"
                  value={exp.job_title || ''}
                  onChange={(e) => handleUpdate(expIndex, 'job_title', e.target.value)}
                  placeholder="e.g. Software Engineer Intern"
                  required
                />

                <Input
                  label="Company / Organization"
                  value={exp.company_name || ''}
                  onChange={(e) => handleUpdate(expIndex, 'company_name', e.target.value)}
                  placeholder="e.g. Acme Corp"
                  required
                />

                <Input
                  label="Location"
                  value={exp.location || ''}
                  onChange={(e) => handleUpdate(expIndex, 'location', e.target.value)}
                  placeholder="e.g. New York, NY / Remote"
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
                    placeholder={exp.is_current ? 'Present' : '08/2023'}
                    disabled={exp.is_current}
                  />
                </div>
              </div>

              {/* Responsibilities bullets */}
              <div style={{ marginTop: '0.75rem', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <label style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--slate-700)' }}>
                    Key Responsibilities & Contributions
                  </label>
                  <Button variant="ghost" size="sm" icon={Plus} onClick={() => handleAddBullet(expIndex, 'responsibilities')}>
                    Add Point
                  </Button>
                </div>
                {exp.responsibilities?.map((bullet, bIdx) => (
                  <div key={bIdx} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <Input
                      value={bullet}
                      onChange={(e) => handleBulletChange(expIndex, 'responsibilities', bIdx, e.target.value)}
                      placeholder="e.g. Developed and tested customer-facing microservices in Python"
                      style={{ marginBottom: 0, flex: 1 }}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveBullet(expIndex, 'responsibilities', bIdx)}
                      style={{ color: 'var(--danger-600)' }}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

