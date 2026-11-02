import React from 'react';
import Input from '../../../../components/common/Input/Input';

export default function PersonalInfoEditor({ data = {}, onChange }) {
  const handleChange = (field, value) => {
    onChange({
      ...data,
      [field]: value,
    });
  };

  return (
    <div>
      <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--slate-900)', marginBottom: '0.25rem' }}>
        Personal & Contact Details
      </h3>
      <p style={{ fontSize: '0.8125rem', color: 'var(--slate-500)', marginBottom: '1.5rem' }}>
        Ensure your phone number, email, and professional links are current for recruiters.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
        <Input
          label="Full Name"
          value={data.full_name || ''}
          onChange={(e) => handleChange('full_name', e.target.value)}
          placeholder="e.g. Alex Johnson"
          required
        />

        <Input
          label="Email Address"
          type="email"
          value={data.email || ''}
          onChange={(e) => handleChange('email', e.target.value)}
          placeholder="alex@university.edu"
          required
        />

        <Input
          label="Phone Number"
          type="tel"
          value={data.phone || ''}
          onChange={(e) => handleChange('phone', e.target.value)}
          placeholder="+1 (555) 019-2834"
        />

        <Input
          label="City"
          value={data.city || ''}
          onChange={(e) => handleChange('city', e.target.value)}
          placeholder="e.g. San Francisco"
        />

        <Input
          label="State / Province"
          value={data.state || ''}
          onChange={(e) => handleChange('state', e.target.value)}
          placeholder="e.g. CA"
        />

        <Input
          label="Country"
          value={data.country || ''}
          onChange={(e) => handleChange('country', e.target.value)}
          placeholder="e.g. USA"
        />

        <Input
          label="LinkedIn URL"
          type="url"
          value={data.linkedin_url || ''}
          onChange={(e) => handleChange('linkedin_url', e.target.value)}
          placeholder="https://linkedin.com/in/username"
        />

        <Input
          label="GitHub URL"
          type="url"
          value={data.github_url || ''}
          onChange={(e) => handleChange('github_url', e.target.value)}
          placeholder="https://github.com/username"
        />

        <Input
          label="Portfolio / Website URL"
          type="url"
          value={data.portfolio_url || ''}
          onChange={(e) => handleChange('portfolio_url', e.target.value)}
          placeholder="https://alexjohnson.dev"
        />
      </div>
    </div>
  );
}

