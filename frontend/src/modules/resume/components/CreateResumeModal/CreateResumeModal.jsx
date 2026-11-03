import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './CreateResumeModal.module.css';
import Modal from '../../../../components/common/Modal/Modal';
import Input from '../../../../components/common/Input/Input';
import Button from '../../../../components/common/Button/Button';
import { useNotification } from '../../../../context/NotificationContext';
import { resumeService } from '../../services/resumeService';
import {
  FilePlus,
  Upload,
  Sparkles,
  LayoutTemplate,
  FileCheck2,
  FileText,
} from 'lucide-react';

const TEMPLATES = [
  {
    id: 'modern',
    name: 'Modern Professional',
    desc: 'Contemporary layout with balanced hierarchy',
    icon: LayoutTemplate,
  },
  {
    id: 'ats',
    name: 'Minimal ATS-Friendly',
    desc: 'Clean single column optimized for scanners',
    icon: FileCheck2,
  },
  {
    id: 'traditional',
    name: 'Traditional',
    desc: 'Classic serif typography & formal headers',
    icon: FileText,
  },
];

export default function CreateResumeModal({ isOpen, onClose, onCreated }) {
  const [activeMode, setActiveMode] = useState('scratch'); // 'scratch' or 'import'
  const [title, setTitle] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [template, setTemplate] = useState('modern');
  const [importFromProfile, setImportFromProfile] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const navigate = useNavigate();
  const { success, error } = useNotification();

  const handleCreate = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!title.trim()) {
      setErrorMessage('Please provide a title for your resume');
      return;
    }

    setIsLoading(true);
    try {
      const newResume = await resumeService.createResume({
        title: title.trim(),
        target_role: targetRole.trim(),
        template,
        import_from_profile: importFromProfile,
      });

      success('Resume created successfully!');
      onClose();
      if (onCreated) onCreated(newResume);
      navigate(`/resumes/${newResume.id}/edit`);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to create resume');
      error(err.message || 'Failed to create resume');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Resume"
      maxWidth="620px"
      footer={
        activeMode === 'scratch' ? (
          <>
            <Button variant="ghost" size="md" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              isLoading={isLoading}
              onClick={handleCreate}
              icon={Sparkles}
            >
              Start Building
            </Button>
          </>
        ) : null
      }
    >
      <div className={styles.modalBody}>
        {/* Toggle Option A vs Option B */}
        <div className={styles.modeToggle}>
          <button
            type="button"
            className={`${styles.modeBtn} ${activeMode === 'scratch' ? styles.activeMode : ''}`}
            onClick={() => setActiveMode('scratch')}
          >
            <FilePlus size={16} />
            <span>Create from Scratch</span>
          </button>
          <button
            type="button"
            className={`${styles.modeBtn} ${activeMode === 'import' ? styles.activeMode : ''}`}
            onClick={() => setActiveMode('import')}
          >
            <Upload size={16} />
            <span>Import Existing PDF</span>
          </button>
        </div>

        {errorMessage && (
          <div style={{ color: 'var(--danger-700)', backgroundColor: 'var(--danger-50)', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-md)', fontSize: '0.8125rem', border: '1px solid #fecaca' }}>
            {errorMessage}
          </div>
        )}

        {/* OPTION A: CREATE FROM SCRATCH */}
        {activeMode === 'scratch' ? (
          <form onSubmit={handleCreate}>
            <Input
              label="Resume Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Full Stack Developer Resume"
              helperText="Descriptive label (e.g. Frontend Internship, Google Application)"
              required
              autoFocus
            />

            <Input
              label="Target Job Role"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              placeholder="e.g. Software Engineer, Data Analyst, Product Manager"
              helperText="Helps AI contextualize bullet points and summary generation"
            />

            {/* Template Selection */}
            <div style={{ marginBottom: '1.25rem' }}>
              <span className={styles.sectionLabel}>Select Starting Template</span>
              <div className={styles.templateGrid}>
                {TEMPLATES.map((tmpl) => {
                  const Icon = tmpl.icon;
                  const isSelected = template === tmpl.id;
                  return (
                    <div
                      key={tmpl.id}
                      className={`${styles.templateCard} ${isSelected ? styles.selectedTemplate : ''}`}
                      onClick={() => setTemplate(tmpl.id)}
                    >
                      <div className={styles.templateIconWrapper}>
                        <Icon size={20} />
                      </div>
                      <span className={styles.templateTitle}>{tmpl.name}</span>
                      <span className={styles.templateDesc}>{tmpl.desc}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Import Profile Toggle */}
            <label className={styles.checkboxRow}>
              <input
                type="checkbox"
                className={styles.checkbox}
                checked={importFromProfile}
                onChange={(e) => setImportFromProfile(e.target.checked)}
              />
              <div className={styles.checkboxText}>
                <span className={styles.checkboxLabel}>
                  Copy information from Student Profile
                </span>
                <span className={styles.checkboxSubtext}>
                  Pre-fills contact info, education, skills, and projects from your profile. Changes to this resume won't modify your original profile.
                </span>
              </div>
            </label>
          </form>
        ) : (
          /* OPTION B: IMPORT EXISTING PDF */
          <div className={styles.importRedirectBox}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12), rgba(168, 85, 247, 0.15))', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Upload size={28} />
            </div>
            <div>
              <h4 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 0.35rem 0', color: 'var(--color-text-primary)' }}>
                Import Your Existing PDF Resume
              </h4>
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', margin: 0, maxWidth: 380, lineHeight: 1.5 }}>
                PyMuPDF extracts raw text and Google Gemini structures it automatically into ATS-compliant sections.
              </p>
            </div>
            <Button
              variant="primary"
              size="md"
              icon={Upload}
              onClick={() => {
                onClose();
                navigate('/resumes/import');
              }}
            >
              Open PDF Importer
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}
