import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import styles from './ResumePreviewPage.module.css';
import TemplateRenderer from '../../templates/TemplateRenderer';
import Button from '../../../components/common/Button/Button';
import Loader from '../../../components/common/Loader/Loader';
import { resumeService } from '../services/resumeService';
import { useNotification } from '../../../context/NotificationContext';
import {
  ArrowLeft,
  Edit,
  Printer,
  Download,
  ZoomIn,
  ZoomOut,
  Sparkles,
} from 'lucide-react';

const TEMPLATES = [
  { id: 'modern', label: 'Modern Professional' },
  { id: 'ats', label: 'Minimal ATS-Friendly' },
  { id: 'traditional', label: 'Traditional' },
];

export default function ResumePreviewPage() {
  const { id } = useParams();
  const [resume, setResume] = useState(null);
  const [activeTemplate, setActiveTemplate] = useState('modern');
  const [zoomLevel, setZoomLevel] = useState(100);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingTemplate, setIsUpdatingTemplate] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const { success, error } = useNotification();

  const loadResume = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await resumeService.getResume(id);
      setResume(data);
      setActiveTemplate(data.template || 'modern');
    } catch (err) {
      error(err.message || 'Failed to load resume for preview');
    } finally {
      setIsLoading(false);
    }
  }, [id, error]);

  useEffect(() => {
    if (id) {
      loadResume();
    }
  }, [id, loadResume]);

  const handleTemplateChange = async (templateId) => {
    if (templateId === activeTemplate) return;
    setActiveTemplate(templateId);
    setIsUpdatingTemplate(true);
    try {
      await resumeService.updateResume(id, { template: templateId });
      setResume((prev) => ({ ...prev, template: templateId }));
      success(`Switched to ${templateId.toUpperCase()} template`);
    } catch (err) {
      error('Failed to update template preference');
    } finally {
      setIsUpdatingTemplate(false);
    }
  };

  const handleZoom = (delta) => {
    setZoomLevel((prev) => Math.min(130, Math.max(70, prev + delta)));
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    setIsDownloading(true);
    try {
      const candidateName = resume.content?.personal_info?.full_name || resume.title || 'Resume';
      const cleanName = candidateName.replace(/[^a-zA-Z0-9_-]/g, '_');
      await resumeService.downloadPdf(id, `${cleanName}_Resume.pdf`);
      success('PDF downloaded successfully!');
    } catch (err) {
      error(err.message || 'Failed to download PDF. Falling back to browser print.');
      window.print();
    } finally {
      setIsDownloading(false);
    }
  };

  if (isLoading) {
    return <Loader fullPage message="Rendering live resume preview..." />;
  }

  if (!resume) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <h2>Resume Not Found</h2>
        <p style={{ color: 'var(--slate-500)', margin: '1rem 0' }}>
          Could not load the resume preview.
        </p>
        <Link to="/dashboard">
          <Button variant="primary" size="md">Back to Dashboard</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.previewPage}>
      {/* Top Controls Toolbar */}
      <div className={styles.topBar}>
        <div className={styles.barLeft}>
          <Link to={`/resumes/${id}/edit`} className={styles.backBtn} title="Back to Editor">
            <Edit size={14} />
            <span>Edit Resume</span>
          </Link>
          <div className={styles.titleArea}>
            <span className={styles.resumeTitle}>{resume.title}</span>
            <span className={styles.resumeRole}>{resume.target_role || 'Target Role Not Specified'}</span>
          </div>
        </div>

        {/* Center: Template Switcher */}
        <div className={styles.barCenter}>
          {TEMPLATES.map((tmpl) => (
            <button
              key={tmpl.id}
              type="button"
              className={`${styles.templateTab} ${activeTemplate === tmpl.id ? styles.activeTemplate : ''}`}
              onClick={() => handleTemplateChange(tmpl.id)}
              disabled={isUpdatingTemplate}
            >
              {tmpl.label}
            </button>
          ))}
        </div>

        {/* Right: Zoom & Export Controls */}
        <div className={styles.barRight}>
          <div className={styles.zoomControls}>
            <button
              type="button"
              className={styles.zoomBtn}
              onClick={() => handleZoom(-10)}
              title="Zoom out"
              disabled={zoomLevel <= 70}
            >
              <ZoomOut size={14} />
            </button>
            <span className={styles.zoomValue}>{zoomLevel}%</span>
            <button
              type="button"
              className={styles.zoomBtn}
              onClick={() => handleZoom(10)}
              title="Zoom in"
              disabled={zoomLevel >= 130}
            >
              <ZoomIn size={14} />
            </button>
          </div>

          <Button variant="outline" size="sm" icon={Printer} onClick={handlePrint}>
            Print / Save
          </Button>

          <Button
            variant="primary"
            size="sm"
            icon={Download}
            isLoading={isDownloading}
            onClick={handleDownloadPdf}
          >
            Download PDF
          </Button>
        </div>
      </div>

      {/* Main Viewport & Paper Layout */}
      <div className={styles.paperViewport}>
        <div
          className={styles.paperSheet}
          style={{ transform: `scale(${zoomLevel / 100})` }}
        >
          {/* Page Break Guide for Standard 11in (1056px) Height */}
          <div className={styles.pageBreakIndicator}>
            <span className={styles.pageBreakLabel}>End of Page 1</span>
          </div>

          <TemplateRenderer
            content={resume.content || {}}
            template={activeTemplate}
            targetRole={resume.target_role}
          />
        </div>
      </div>
    </div>
  );
}

