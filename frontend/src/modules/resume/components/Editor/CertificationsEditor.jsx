import React from 'react';
import Input from '../../../../components/common/Input/Input';
import Button from '../../../../components/common/Button/Button';
import Card from '../../../../components/common/Card/Card';
import { Plus, Trash2, Award } from 'lucide-react';
import s from './EditorSections.module.css';

export default function CertificationsEditor({ list = [], onChange }) {
  const handleAdd = () => {
    const newRecord = {
      id: `CERT_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      certification_name: '',
      issuing_organization: '',
      issue_date: '',
      credential_url: '',
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
          <h3 className={s.sectionTitle}>Certifications & Licenses</h3>
          <p className={s.sectionSubtitle}>
            Add industry credentials (AWS Certified Developer, CompTIA, Google Cloud Associate).
          </p>
        </div>
        <Button variant="primary" size="sm" icon={Plus} onClick={handleAdd}>
          Add Certification
        </Button>
      </div>

      {list.length === 0 ? (
        <div className={s.emptyStateCard}>
          <div className={s.emptyIconCircle}>
            <Award size={24} />
          </div>
          <p className={s.emptyStateText}>No certifications added yet.</p>
          <Button variant="outline" size="sm" icon={Plus} onClick={handleAdd} style={{ marginTop: '0.5rem' }}>
            Add Certificate
          </Button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {list.map((cert, index) => (
            <Card
              key={cert.id || index}
              title={cert.certification_name || `Certificate #${index + 1}`}
              subtitle={cert.issuing_organization || 'Issuing body'}
              actions={
                <button
                  type="button"
                  className={s.deleteIconBtn}
                  onClick={() => handleRemove(index)}
                  title="Remove certificate"
                >
                  <Trash2 size={16} />
                </button>
              }
            >
              <div className={s.gridTwoCol}>
                <Input
                  label="Certification Name"
                  value={cert.certification_name || ''}
                  onChange={(e) => handleUpdate(index, 'certification_name', e.target.value)}
                  placeholder="e.g. AWS Certified Solutions Architect"
                  required
                />

                <Input
                  label="Issuing Organization"
                  value={cert.issuing_organization || ''}
                  onChange={(e) => handleUpdate(index, 'issuing_organization', e.target.value)}
                  placeholder="e.g. Amazon Web Services (AWS)"
                  required
                />

                <Input
                  label="Issue Date"
                  value={cert.issue_date || ''}
                  onChange={(e) => handleUpdate(index, 'issue_date', e.target.value)}
                  placeholder="MM/YYYY or 2024"
                />

                <Input
                  label="Credential Verification URL"
                  value={cert.credential_url || ''}
                  onChange={(e) => handleUpdate(index, 'credential_url', e.target.value)}
                  placeholder="https://credly.com/badges/..."
                />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
