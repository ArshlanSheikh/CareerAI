import React from 'react';
import Input from '../../../components/common/Input/Input';
import Button from '../../../components/common/Button/Button';
import Card from '../../../components/common/Card/Card';
import { Plus, Trash2, GraduationCap } from 'lucide-react';

export default function EducationSection({ list = [], onChange }) {
  const handleAdd = () => {
    const newRecord = {
      id: `EDU_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      degree: '',
      field_of_study: '',
      institution: '',
      start_year: '',
      end_year: '',
      grade_type: 'GPA',
      grade: '',
      description: '',
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

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--slate-900)' }}>
            Education History
          </h3>
          <p style={{ fontSize: '0.8125rem', color: 'var(--slate-500)' }}>
            Add your degrees, schools, GPA, and academic coursework.
          </p>
        </div>
        <Button variant="outline" size="sm" icon={Plus} onClick={handleAdd}>
          Add Education
        </Button>
      </div>

      {list.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', border: '1px dashed var(--slate-300)', borderRadius: 'var(--radius-lg)', color: 'var(--slate-500)' }}>
          <GraduationCap size={32} style={{ margin: '0 auto 0.5rem', opacity: 0.6 }} />
          <p style={{ fontSize: '0.875rem' }}>No education records added yet.</p>
          <Button variant="secondary" size="sm" icon={Plus} onClick={handleAdd} style={{ marginTop: '0.75rem' }}>
            Add Your College / Degree
          </Button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {list.map((item, index) => (
            <Card
              key={item.id || index}
              title={item.degree ? `${item.degree} ${item.field_of_study ? 'in ' + item.field_of_study : ''}` : `Education #${index + 1}`}
              subtitle={item.institution || 'University name'}
              actions={
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemove(index)}
                  title="Remove education"
                  style={{ color: 'var(--danger-600)' }}
                >
                  <Trash2 size={16} />
                </Button>
              }
            >
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                <Input
                  label="Degree"
                  value={item.degree || ''}
                  onChange={(e) => handleUpdate(index, 'degree', e.target.value)}
                  placeholder="e.g. B.Tech / B.S."
                  required
                />

                <Input
                  label="Field of Study / Major"
                  value={item.field_of_study || ''}
                  onChange={(e) => handleUpdate(index, 'field_of_study', e.target.value)}
                  placeholder="e.g. Computer Science"
                />

                <Input
                  label="Institution / University"
                  value={item.institution || ''}
                  onChange={(e) => handleUpdate(index, 'institution', e.target.value)}
                  placeholder="e.g. Stanford University"
                  required
                />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <Input
                    label="Start Year"
                    value={item.start_year || ''}
                    onChange={(e) => handleUpdate(index, 'start_year', e.target.value)}
                    placeholder="2021"
                  />
                  <Input
                    label="End Year / Grad"
                    value={item.end_year || ''}
                    onChange={(e) => handleUpdate(index, 'end_year', e.target.value)}
                    placeholder="2025"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <Input
                    label="Grade Type"
                    value={item.grade_type || 'GPA'}
                    onChange={(e) => handleUpdate(index, 'grade_type', e.target.value)}
                    placeholder="GPA / %"
                  />
                  <Input
                    label="Grade / Score"
                    value={item.grade || ''}
                    onChange={(e) => handleUpdate(index, 'grade', e.target.value)}
                    placeholder="e.g. 3.8 / 85%"
                  />
                </div>

                <Input
                  label="Academic Highlights / Description"
                  value={item.description || ''}
                  onChange={(e) => handleUpdate(index, 'description', e.target.value)}
                  placeholder="Relevant coursework, Dean's List, academic honors"
                />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

