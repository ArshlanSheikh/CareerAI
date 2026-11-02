import React from 'react';
import Input from '../../../../components/common/Input/Input';
import Button from '../../../../components/common/Button/Button';
import Card from '../../../../components/common/Card/Card';
import { Plus, Trash2, Layers, Sparkles } from 'lucide-react';

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--slate-900)' }}>
            Internships & Fellowships
          </h3>
          <p style={{ fontSize: '0.8125rem', color: 'var(--slate-500)' }}>
            Highlight summer internships, research fellowships, or co-op training programs.
          </p>
        </div>
        <Button variant="outline" size="sm" icon={Plus} onClick={handleAdd}>
          Add Internship
        </Button>
      </div>

      {list.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', border: '1px dashed var(--slate-300)', borderRadius: 'var(--radius-lg)', color: 'var(--slate-500)' }}>
          <Layers size={32} style={{ margin: '0 auto 0.5rem', opacity: 0.6 }} />
          <p style={{ fontSize: '0.875rem' }}>No internship records added yet.</p>
          <Button variant="secondary" size="sm" icon={Plus} onClick={handleAdd} style={{ marginTop: '0.75rem' }}>
            Add Your Internship
          </Button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {list.map((item, intIndex) => (
            <Card
              key={item.id || intIndex}
              title={item.position ? `${item.position} at ${item.organization || 'Organization'}` : `Internship #${intIndex + 1}`}
              subtitle={item.start_date ? `${item.start_date} – ${item.end_date || 'Present'}` : ''}
              actions={
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  {onTriggerAi && (
                    <Button
                      variant="outline"
                      size="sm"
                      icon={Sparkles}
                      onClick={() => onTriggerAi(intIndex, item)}
                      style={{ color: 'var(--primary-600)', borderColor: 'var(--primary-300)' }}
                    >
                      AI Assist
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemove(intIndex)}
                    title="Remove internship"
                    style={{ color: 'var(--danger-600)' }}
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              }
            >
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
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
              <div style={{ marginTop: '0.75rem', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <label style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--slate-700)' }}>
                    Responsibilities & Deliverables
                  </label>
                  <Button variant="ghost" size="sm" icon={Plus} onClick={() => handleAddBullet(intIndex)}>
                    Add Bullet
                  </Button>
                </div>
                {item.responsibilities?.map((bullet, bIdx) => (
                  <div key={bIdx} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <Input
                      value={bullet}
                      onChange={(e) => handleBulletChange(intIndex, bIdx, e.target.value)}
                      placeholder="e.g. Collaborated with senior engineers to implement WCAG 2.1 accessibility standards"
                      style={{ marginBottom: 0, flex: 1 }}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveBullet(intIndex, bIdx)}
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

