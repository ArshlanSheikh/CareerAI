import React from 'react';
import Input from '../../../../components/common/Input/Input';
import Button from '../../../../components/common/Button/Button';
import Card from '../../../../components/common/Card/Card';
import { Plus, Trash2, Award } from 'lucide-react';

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--slate-900)' }}>
            Certifications & Licenses
          </h3>
          <p style={{ fontSize: '0.8125rem', color: 'var(--slate-500)' }}>
            Add industry credentials (AWS Certified Developer, CompTIA, Google Cloud Associate).
          </p>
        </div>
        <Button variant="outline" size="sm" icon={Plus} onClick={handleAdd}>
          Add Certification
        </Button>
      </div>

      {list.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', border: '1px dashed var(--slate-300)', borderRadius: 'var(--radius-lg)', color: 'var(--slate-500)' }}>
          <Award size={32} style={{ margin: '0 auto 0.5rem', opacity: 0.6 }} />
          <p style={{ fontSize: '0.875rem' }}>No certifications added yet.</p>
          <Button variant="secondary" size="sm" icon={Plus} onClick={handleAdd} style={{ marginTop: '0.75rem' }}>
            Add Certificate
          </Button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {list.map((cert, index) => (
            <Card
              key={cert.id || index}
              title={cert.certification_name || `Certificate #${index + 1}`}
              subtitle={cert.issuing_organization || 'Issuing body'}
              actions={
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemove(index)}
                  title="Remove certificate"
                  style={{ color: 'var(--danger-600)' }}
                >
                  <Trash2 size={16} />
                </Button>
              }
            >
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
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

