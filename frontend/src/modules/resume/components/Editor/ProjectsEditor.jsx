import React, { useState } from 'react';
import Input from '../../../../components/common/Input/Input';
import Button from '../../../../components/common/Button/Button';
import Card from '../../../../components/common/Card/Card';
import { Plus, Trash2, FolderGit2, X, Sparkles } from 'lucide-react';
import s from './EditorSections.module.css';

export default function ProjectsEditor({ list = [], onChange, onTriggerAi }) {
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
      <div className={s.sectionHeader}>
        <div className={s.titleGroup}>
          <h3 className={s.sectionTitle}>Projects</h3>
          <p className={s.sectionSubtitle}>
            Highlight personal, academic, or open-source software projects and your actual technical contributions.
          </p>
        </div>
        <Button variant="primary" size="sm" icon={Plus} onClick={handleAddProject}>
          Add Project
        </Button>
      </div>

      <div style={{
        marginBottom: '1rem',
        padding: '0.65rem 0.9rem',
        borderRadius: 'var(--radius-lg)',
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(168, 85, 247, 0.05) 100%)',
        border: '1px solid rgba(99, 102, 241, 0.15)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        fontSize: '0.785rem',
        color: 'var(--slate-700)',
      }}>
        <Sparkles size={15} color="var(--primary-600)" style={{ flexShrink: 0 }} />
        <div>
          <strong>XYZ Formula Tip:</strong> Describe what you accomplished [X], measured by metric [Y], by doing [Z] (e.g. "Architected REST endpoints reducing latency by 35% via Redis caching").
        </div>
      </div>

      {list.length === 0 ? (
        <div className={s.emptyStateCard}>
          <div className={s.emptyIconCircle}>
            <FolderGit2 size={24} />
          </div>
          <p className={s.emptyStateText}>No projects added to this resume yet.</p>
          <Button variant="outline" size="sm" icon={Plus} onClick={handleAddProject} style={{ marginTop: '0.5rem' }}>
            Add Your First Project
          </Button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {list.map((proj, projIndex) => (
            <Card
              key={proj.id || projIndex}
              title={proj.name || `Project #${projIndex + 1}`}
              subtitle={proj.role || 'Role / Stack'}
              actions={
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  {onTriggerAi && (
                    <button
                      type="button"
                      className={s.aiAssistBtn}
                      onClick={() => onTriggerAi(projIndex, proj)}
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
                    onClick={() => handleRemove(projIndex)}
                    title="Remove project"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              }
            >
              <div className={s.gridTwoCol}>
                <Input
                  label="Project Title"
                  value={proj.name || ''}
                  onChange={(e) => handleUpdate(projIndex, 'name', e.target.value)}
                  placeholder="e.g. Real-Time Chat Engine"
                  required
                />

                <Input
                  label="Your Role"
                  value={proj.role || ''}
                  onChange={(e) => handleUpdate(projIndex, 'role', e.target.value)}
                  placeholder="e.g. Lead Full-Stack Developer"
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
                  label="GitHub Repository"
                  value={proj.github_url || ''}
                  onChange={(e) => handleUpdate(projIndex, 'github_url', e.target.value)}
                  placeholder="https://github.com/..."
                />

                <Input
                  label="Live Demo Link"
                  value={proj.live_url || ''}
                  onChange={(e) => handleUpdate(projIndex, 'live_url', e.target.value)}
                  placeholder="https://project-demo.com"
                />
              </div>

              {/* Technologies */}
              <div style={{ marginTop: '0.75rem', marginBottom: '0.75rem' }}>
                <label className={s.textareaLabel} style={{ display: 'block', marginBottom: '0.35rem' }}>
                  Technologies & Frameworks
                </label>
                <div className={s.tagsContainer} style={{ marginBottom: '0.5rem' }}>
                  {proj.technologies?.map((tech, techIdx) => (
                    <span key={techIdx} className={s.tagPill}>
                      <span>{tech}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTech(projIndex, techIdx)}
                        className={s.tagRemoveBtn}
                        aria-label={`Remove ${tech}`}
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
                <div className={s.quickAddRow} style={{ maxWidth: '340px' }}>
                  <Input
                    placeholder="Add tech (e.g. Redis, WebSockets)..."
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

              {/* Description */}
              <div style={{ marginBottom: '1rem' }}>
                <Input
                  label="Project Overview"
                  value={proj.description || ''}
                  onChange={(e) => handleUpdate(projIndex, 'description', e.target.value)}
                  placeholder="Brief overview explaining purpose, core features, and architectural design"
                />
              </div>

              {/* Key Contributions & Features */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <label className={s.textareaLabel}>
                    Key Bullet Points & Personally Implemented Features
                  </label>
                  <button
                    type="button"
                    className={s.addBulletBtn}
                    onClick={() => handleAddBullet(projIndex, 'personally_implemented_features')}
                  >
                    <Plus size={13} />
                    <span>Add Bullet</span>
                  </button>
                </div>
                <div className={s.bulletsContainer}>
                  {proj.personally_implemented_features?.map((bullet, bIdx) => (
                    <div key={bIdx} className={s.bulletRow}>
                      <span className={s.bulletDot} />
                      <input
                        className={s.bulletInput}
                        value={bullet}
                        onChange={(e) => handleBulletChange(projIndex, 'personally_implemented_features', bIdx, e.target.value)}
                        placeholder="e.g. Architected Redis pub/sub messaging layer handling 10,000+ concurrent connections"
                      />
                      <button
                        type="button"
                        className={s.deleteIconBtn}
                        onClick={() => handleRemoveBullet(projIndex, 'personally_implemented_features', bIdx)}
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
