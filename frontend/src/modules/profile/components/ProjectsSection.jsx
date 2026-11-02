import React, { useState } from 'react';
import Input from '../../../components/common/Input/Input';
import Button from '../../../components/common/Button/Button';
import Card from '../../../components/common/Card/Card';
import { Plus, Trash2, FolderGit2, X } from 'lucide-react';

export default function ProjectsSection({ list = [], onChange }) {
  const [techInputs, setTechInputs] = useState({});

  const handleAddProject = () => {
    const newRecord = {
      id: `PROJ_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: '',
      description: '',
      technologies: [],
      role: '',
      start_date: '',
      end_date: '',
      github_url: '',
      live_url: '',
      key_contributions: [''],
      personally_implemented_features: [''],
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

  const handleAddTech = (projIndex) => {
    const tech = techInputs[projIndex]?.trim();
    if (!tech) return;
    const updated = [...list];
    if (!updated[projIndex].technologies.includes(tech)) {
      updated[projIndex].technologies = [...updated[projIndex].technologies, tech];
      onChange(updated);
    }
    setTechInputs({ ...techInputs, [projIndex]: '' });
  };

  const handleRemoveTech = (projIndex, techIndex) => {
    const updated = [...list];
    updated[projIndex].technologies = updated[projIndex].technologies.filter((_, idx) => idx !== techIndex);
    onChange(updated);
  };

  const handleBulletChange = (projIndex, field, bIndex, value) => {
    const updated = [...list];
    const bullets = [...(updated[projIndex][field] || [])];
    bullets[bIndex] = value;
    updated[projIndex][field] = bullets;
    onChange(updated);
  };

  const handleAddBullet = (projIndex, field) => {
    const updated = [...list];
    updated[projIndex][field] = [...(updated[projIndex][field] || []), ''];
    onChange(updated);
  };

  const handleRemoveBullet = (projIndex, field, bIndex) => {
    const updated = [...list];
    updated[projIndex][field] = (updated[projIndex][field] || []).filter((_, idx) => idx !== bIndex);
    onChange(updated);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--slate-900)' }}>
            Projects Showcase
          </h3>
          <p style={{ fontSize: '0.8125rem', color: 'var(--slate-500)' }}>
            Add notable academic, open-source, or personal projects with technologies and your actual contributions.
          </p>
        </div>
        <Button variant="outline" size="sm" icon={Plus} onClick={handleAddProject}>
          Add Project
        </Button>
      </div>

      {list.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', border: '1px dashed var(--slate-300)', borderRadius: 'var(--radius-lg)', color: 'var(--slate-500)' }}>
          <FolderGit2 size={32} style={{ margin: '0 auto 0.5rem', opacity: 0.6 }} />
          <p style={{ fontSize: '0.875rem' }}>No projects added yet.</p>
          <Button variant="secondary" size="sm" icon={Plus} onClick={handleAddProject} style={{ marginTop: '0.75rem' }}>
            Add Your First Project
          </Button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {list.map((proj, projIndex) => (
            <Card
              key={proj.id || projIndex}
              title={proj.name || `Project #${projIndex + 1}`}
              subtitle={proj.role || 'Full-Stack Developer'}
              actions={
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemove(projIndex)}
                  title="Remove project"
                  style={{ color: 'var(--danger-600)' }}
                >
                  <Trash2 size={16} />
                </Button>
              }
            >
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                <Input
                  label="Project Name"
                  value={proj.name || ''}
                  onChange={(e) => handleUpdate(projIndex, 'name', e.target.value)}
                  placeholder="e.g. AI Code Reviewer"
                  required
                />

                <Input
                  label="Role in Project"
                  value={proj.role || ''}
                  onChange={(e) => handleUpdate(projIndex, 'role', e.target.value)}
                  placeholder="e.g. Lead Frontend Developer"
                />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <Input
                    label="Start Date"
                    value={proj.start_date || ''}
                    onChange={(e) => handleUpdate(projIndex, 'start_date', e.target.value)}
                    placeholder="01/2024"
                  />
                  <Input
                    label="End Date"
                    value={proj.end_date || ''}
                    onChange={(e) => handleUpdate(projIndex, 'end_date', e.target.value)}
                    placeholder="05/2024"
                  />
                </div>

                <Input
                  label="GitHub Repo URL"
                  value={proj.github_url || ''}
                  onChange={(e) => handleUpdate(projIndex, 'github_url', e.target.value)}
                  placeholder="https://github.com/..."
                />

                <Input
                  label="Live Demo URL"
                  value={proj.live_url || ''}
                  onChange={(e) => handleUpdate(projIndex, 'live_url', e.target.value)}
                  placeholder="https://my-app.vercel.app"
                />
              </div>

              {/* Technologies */}
              <div style={{ marginTop: '0.75rem', marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--slate-700)', display: 'block', marginBottom: '0.35rem' }}>
                  Technologies Used
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.5rem' }}>
                  {proj.technologies?.map((tech, techIdx) => (
                    <span
                      key={techIdx}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        padding: '0.2rem 0.55rem',
                        backgroundColor: 'var(--slate-100)',
                        color: 'var(--slate-800)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        border: '1px solid var(--slate-300)',
                      }}
                    >
                      <span>{tech}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTech(projIndex, techIdx)}
                        style={{ cursor: 'pointer', display: 'flex' }}
                      >
                        <X size={10} />
                      </button>
                    </span>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', maxWidth: '320px' }}>
                  <Input
                    placeholder="Add tech (e.g. Next.js)..."
                    value={techInputs[projIndex] || ''}
                    onChange={(e) => setTechInputs({ ...techInputs, [projIndex]: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTech(projIndex);
                      }
                    }}
                    style={{ marginBottom: 0, flex: 1 }}
                  />
                  <Button variant="secondary" size="sm" onClick={() => handleAddTech(projIndex)}>
                    Add
                  </Button>
                </div>
              </div>

              {/* Project Description */}
              <div style={{ marginBottom: '1rem' }}>
                <Input
                  label="Project Overview"
                  value={proj.description || ''}
                  onChange={(e) => handleUpdate(projIndex, 'description', e.target.value)}
                  placeholder="Brief summary of what this project does and problems it solves"
                />
              </div>

              {/* Personally Implemented Features & Contributions */}
              <div style={{ marginBottom: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <label style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--slate-700)' }}>
                    Personally Implemented Features & Accomplishments
                  </label>
                  <Button variant="ghost" size="sm" icon={Plus} onClick={() => handleAddBullet(projIndex, 'personally_implemented_features')}>
                    Add Point
                  </Button>
                </div>
                {proj.personally_implemented_features?.map((bullet, bIdx) => (
                  <div key={bIdx} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <Input
                      value={bullet}
                      onChange={(e) => handleBulletChange(projIndex, 'personally_implemented_features', bIdx, e.target.value)}
                      placeholder="e.g. Built automated GitHub Actions CI/CD pipeline reducing release cycle by 40%"
                      style={{ marginBottom: 0, flex: 1 }}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveBullet(projIndex, 'personally_implemented_features', bIdx)}
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

