import React from 'react';
import Input from '../../../../components/common/Input/Input';
import Button from '../../../../components/common/Button/Button';
import Card from '../../../../components/common/Card/Card';
import { Plus, Trash2, GraduationCap } from 'lucide-react';
import s from './EditorSections.module.css';

export default function EducationEditor({ list = [], onChange }) {
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
      <div className={s.sectionHeader}>
        <div className={s.titleGroup}>
          <h3 className={s.sectionTitle}>Education</h3>
          <p className={s.sectionSubtitle}>
            List your university degrees, majors, GPA, and relevant academic coursework.
          </p>
        </div>
        <Button variant="primary" size="sm" icon={Plus} onClick={handleAdd}>
          Add Education
        </Button>
      </div>

      {list.length === 0 ? (
        <div className={s.emptyStateCard}>
          <div className={s.emptyIconCircle}>
            <GraduationCap size={24} />
          </div>
          <p className={s.emptyStateText}>No education records added yet.</p>
          <Button variant="outline" size="sm" icon={Plus} onClick={handleAdd} style={{ marginTop: '0.5rem' }}>
            Add College / Degree
          </Button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {list.map((item, index) => (
            <Card
              key={item.id || index}
              title={item.degree ? `${item.degree} in ${item.field_of_study || 'Major'}` : `Education #${index + 1}`}
              subtitle={item.institution || 'Institution name'}
              actions={
                <button
                  type="button"
                  className={s.deleteIconBtn}
                  onClick={() => handleRemove(index)}
                  title="Remove education"
                >
                  <Trash2 size={16} />
                </button>
              }
            >
              <div className={s.gridTwoCol}>
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
                    placeholder="GPA / % / CGPA"
                  />
                  <Input
                    label="Score / Grade"
                    value={item.grade || ''}
                    onChange={(e) => handleUpdate(index, 'grade', e.target.value)}
                    placeholder="e.g. 3.85 / 88%"
                  />
                </div>

                <Input
                  label="Honors & Coursework Description"
                  value={item.description || ''}
                  onChange={(e) => handleUpdate(index, 'description', e.target.value)}
                  placeholder="Dean's List, Relevant Coursework: Data Structures, Algorithms"
                />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
