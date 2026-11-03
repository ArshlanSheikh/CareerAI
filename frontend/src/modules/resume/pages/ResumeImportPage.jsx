import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import styles from './ResumeImportPage.module.css';
import Button from '../../../components/common/Button/Button';
import { resumeService } from '../services/resumeService';
import { useNotification } from '../../../context/NotificationContext';
import {
  Upload,
  FileText,
  X,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  Info,
  User,
  GraduationCap,
  Code2,
  FolderGit2,
  Briefcase,
  Layers,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';

const ALLOWED_EXTENSIONS = ['.pdf', '.docx', '.doc'];

export default function ResumeImportPage() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0); // 0 = idle, 1 = upload, 2 = extraction, 3 = gemini
  const [extractedData, setExtractedData] = useState(null);
  const [resumeTitle, setResumeTitle] = useState('');
  const [isFinalizing, setIsFinalizing] = useState(false);
  const fileInputRef = useRef(null);

  const navigate = useNavigate();
  const notify = useNotification();

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (file) => {
    const filename = file.name.toLowerCase();
    const hasValidExt = ALLOWED_EXTENSIONS.some((ext) => filename.endsWith(ext));

    if (!hasValidExt) {
      notify.error('Please upload a valid document: PDF (.pdf), Word (.docx), or legacy Word (.doc)');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      notify.error('File size exceeds the 10MB limit');
      return;
    }
    setSelectedFile(file);
    setExtractedData(null);
  };

  const getFileFormat = (fileName) => {
    if (!fileName) return 'FILE';
    const ext = fileName.split('.').pop().toUpperCase();
    return ext;
  };

  const handleExtractAndReview = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setCurrentStep(1);

    const stepTimer1 = setTimeout(() => setCurrentStep(2), 900);
    const stepTimer2 = setTimeout(() => setCurrentStep(3), 2200);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await resumeService.extractResumePreview(formData);
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      setCurrentStep(4);

      setExtractedData(response);
      setResumeTitle(response.suggested_title || `${selectedFile.name.split('.')[0]} Resume`);
      notify.success('Resume parsed successfully! Please review the extracted sections below.');
    } catch (err) {
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      setCurrentStep(0);
      notify.error(err.message || 'Failed to extract resume. Please try another document or create from scratch.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmAndCreate = async () => {
    if (!extractedData?.parsed_content) return;

    setIsFinalizing(true);
    try {
      const newResume = await resumeService.importFromConfirmed(
        resumeTitle.trim() || extractedData.suggested_title,
        extractedData.parsed_content
      );

      notify.success('Resume imported successfully! Launching Analytics Dashboard...');
      setTimeout(() => {
        navigate(`/resumes/${newResume.id}/analysis`);
      }, 400);
    } catch (err) {
      notify.error(err.message || 'Failed to create resume from extracted data');
      setIsFinalizing(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setExtractedData(null);
    setCurrentStep(0);
    setResumeTitle('');
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const isDocFormat = (fileName) => {
    const ext = (fileName || '').toLowerCase();
    return ext.endsWith('.docx') || ext.endsWith('.doc');
  };

  return (
    <div className={styles.pageContainer}>
      {/* Header */}
      <div className={styles.header}>
        <Link to="/dashboard" className={styles.backLink}>
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>
        <div className={styles.badgeRow}>
          <span className={styles.engineBadge}>
            <Sparkles size={13} /> Multi-Format Engine (PyMuPDF + Word)
          </span>
          <span className={styles.formatBadge}>PDF</span>
          <span className={styles.formatBadge}>DOCX</span>
          <span className={styles.formatBadge}>DOC</span>
        </div>
        <h1 className={styles.title}>
          {extractedData ? 'Review Extracted Resume' : 'Import Existing Resume'}
        </h1>
        <p className={styles.subtitle}>
          {extractedData
            ? 'Review the extracted contact info, education, skills, and projects below. You can make final adjustments before opening inside the resume editor.'
            : 'Upload your current resume in PDF or Word format. Our multi-format parsing pipeline extracts layout data and Google Gemini structures it into our standardized ATS schema.'}
        </p>
      </div>

      <div className={styles.card}>
        {!extractedData ? (
          <>
            {/* Dropzone */}
            {!selectedFile ? (
              <div
                className={`${styles.dropzone} ${isDragging ? styles.dropzoneActive : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className={styles.dropzoneIconWrapper}>
                  <Upload size={30} />
                </div>
                <p className={styles.dropzonePrompt}>
                  Click to select or drag and drop your resume file
                </p>
                <p className={styles.dropzoneSubprompt}>
                  Supported formats: PDF (.pdf), Word Document (.docx), or legacy Word (.doc) up to 10MB
                </p>
                <div className={styles.supportedFormatsPills}>
                  <span className={styles.formatBadge}>.pdf</span>
                  <span className={styles.formatBadge}>.docx</span>
                  <span className={styles.formatBadge}>.doc</span>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.doc,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword"
                  className={styles.hiddenInput}
                  onChange={handleFileChange}
                />
              </div>
            ) : (
              /* Selected File Badge */
              <div className={styles.fileBadge}>
                <div className={styles.fileBadgeLeft}>
                  <div className={`${styles.fileIconBox} ${isDocFormat(selectedFile.name) ? styles.docIconBox : styles.pdfIconBox}`}>
                    <FileText size={22} />
                  </div>
                  <div>
                    <div className={styles.fileName}>{selectedFile.name}</div>
                    <div className={styles.fileMeta}>
                      <span className={styles.fileFormatTag}>{getFileFormat(selectedFile.name)}</span>
                      <span>{formatFileSize(selectedFile.size)}</span>
                      <span>•</span>
                      <span>Ready for parsing</span>
                    </div>
                  </div>
                </div>
                {!isProcessing && (
                  <button
                    type="button"
                    className={styles.removeBtn}
                    onClick={() => setSelectedFile(null)}
                    title="Remove file"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>
            )}

            {/* Processing Progress Steps */}
            {isProcessing && (
              <div className={styles.progressContainer}>
                <div className={styles.progressTitle}>
                  <Sparkles size={16} style={{ color: 'var(--color-primary)' }} />
                  <span>Multi-Stage Extraction & Structuring Pipeline</span>
                </div>

                <div className={styles.stepsList}>
                  <div
                    className={`${styles.stepItem} ${
                      currentStep === 1 ? styles.stepItemActive : currentStep > 1 ? styles.stepItemDone : ''
                    }`}
                  >
                    <div
                      className={`${styles.stepDot} ${
                        currentStep === 1 ? styles.stepDotActive : currentStep > 1 ? styles.stepDotDone : ''
                      }`}
                    >
                      {currentStep > 1 ? <CheckCircle2 size={16} /> : '1'}
                    </div>
                    <span>Uploading and verifying document format integrity...</span>
                  </div>

                  <div
                    className={`${styles.stepItem} ${
                      currentStep === 2 ? styles.stepItemActive : currentStep > 2 ? styles.stepItemDone : ''
                    }`}
                  >
                    <div
                      className={`${styles.stepDot} ${
                        currentStep === 2 ? styles.stepDotActive : currentStep > 2 ? styles.stepDotDone : ''
                      }`}
                    >
                      {currentStep > 2 ? <CheckCircle2 size={16} /> : '2'}
                    </div>
                    <span>Extracting text layers with PyMuPDF & Word parser...</span>
                  </div>

                  <div
                    className={`${styles.stepItem} ${
                      currentStep === 3 ? styles.stepItemActive : currentStep > 3 ? styles.stepItemDone : ''
                    }`}
                  >
                    <div
                      className={`${styles.stepDot} ${
                        currentStep === 3 ? styles.stepDotActive : currentStep > 3 ? styles.stepDotDone : ''
                      }`}
                    >
                      {currentStep > 3 ? <CheckCircle2 size={16} /> : '3'}
                    </div>
                    <span>Gemini AI structuring education, skills, projects, and work experience...</span>
                  </div>
                </div>
              </div>
            )}

            {/* Guidance Callout */}
            <div className={styles.infoBox}>
              <Info className={styles.infoIcon} size={18} />
              <div>
                <strong>Supported Formats:</strong> Both PDF and Word documents are supported. Scanned image-only documents cannot be parsed. You will be able to review and confirm all extracted fields before opening your resume.
              </div>
            </div>

            {/* Actions */}
            <div className={styles.actionsRow}>
              <Link to="/dashboard">
                <Button variant="ghost" size="md" disabled={isProcessing}>
                  Cancel
                </Button>
              </Link>

              <Button
                variant="primary"
                size="md"
                disabled={!selectedFile || isProcessing}
                isLoading={isProcessing}
                onClick={handleExtractAndReview}
                icon={Sparkles}
              >
                Extract & Review Resume
              </Button>
            </div>
          </>
        ) : (
          /* =========================================================================
             EXTRACTION REVIEW STAGE
             ========================================================================= */
          <div className={styles.reviewContainer}>
            {/* Success Banner */}
            <div className={styles.reviewSuccessBanner}>
              <div className={styles.successIconCircle}>
                <CheckCircle2 size={24} />
              </div>
              <div>
                <h3 className={styles.successBannerTitle}>Extraction Successful!</h3>
                <p className={styles.successBannerSubtitle}>
                  We extracted structured data from <strong>{extractedData.filename}</strong>. Review the summary below.
                </p>
              </div>
            </div>

            {/* Title Editor */}
            <div className={styles.titleEditorCard}>
              <label className={styles.titleEditorLabel}>Resume Title</label>
              <input
                type="text"
                className={styles.titleEditorInput}
                value={resumeTitle}
                onChange={(e) => setResumeTitle(e.target.value)}
                placeholder="Descriptive resume title..."
              />
            </div>

            {/* Section Breakdown Grid */}
            <div className={styles.reviewGrid}>
              {/* Personal Info */}
              <div className={styles.reviewCard}>
                <div className={styles.reviewCardHeader}>
                  <span className={styles.reviewCardTitle}>
                    <User size={15} color="var(--color-primary)" />
                    Personal Details
                  </span>
                  <span className={styles.reviewCountBadge}>
                    {extractedData.parsed_content?.personal_info?.full_name ? 'Identified' : 'Blank'}
                  </span>
                </div>
                <div className={styles.reviewCardBody}>
                  <div>
                    <strong>Name:</strong> {extractedData.parsed_content?.personal_info?.full_name || 'Not detected'}
                  </div>
                  <div>
                    <strong>Email:</strong> {extractedData.parsed_content?.personal_info?.email || 'Not detected'}
                  </div>
                  <div>
                    <strong>Phone:</strong> {extractedData.parsed_content?.personal_info?.phone || 'Not detected'}
                  </div>
                  <div>
                    <strong>Location:</strong>{' '}
                    {[
                      extractedData.parsed_content?.personal_info?.city,
                      extractedData.parsed_content?.personal_info?.state,
                    ].filter(Boolean).join(', ') || 'Not detected'}
                  </div>
                </div>
              </div>

              {/* Professional Summary */}
              <div className={styles.reviewCard}>
                <div className={styles.reviewCardHeader}>
                  <span className={styles.reviewCardTitle}>
                    <FileText size={15} color="var(--color-primary)" />
                    Professional Summary
                  </span>
                  <span className={styles.reviewCountBadge}>
                    {extractedData.parsed_content?.professional_summary?.content ? 'Found' : 'Empty'}
                  </span>
                </div>
                <div className={styles.reviewCardBody}>
                  <p style={{ margin: 0, fontStyle: 'italic', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {extractedData.parsed_content?.professional_summary?.content || '(No summary text detected in document)'}
                  </p>
                  <div>
                    <strong>Target Role:</strong> {extractedData.parsed_content?.professional_summary?.target_role || 'General'}
                  </div>
                </div>
              </div>

              {/* Education */}
              <div className={styles.reviewCard}>
                <div className={styles.reviewCardHeader}>
                  <span className={styles.reviewCardTitle}>
                    <GraduationCap size={15} color="var(--color-primary)" />
                    Education
                  </span>
                  <span className={styles.reviewCountBadge}>
                    {extractedData.parsed_content?.education?.length || 0} Records
                  </span>
                </div>
                <div className={styles.reviewCardBody}>
                  {extractedData.parsed_content?.education?.length > 0 ? (
                    <ul className={styles.reviewItemList}>
                      {extractedData.parsed_content.education.map((edu, i) => (
                        <li key={i} className={styles.reviewItem}>
                          <span>•</span>
                          <span>{edu.degree || 'Degree'} – {edu.institution || 'University'}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <span>No education records detected.</span>
                  )}
                </div>
              </div>

              {/* Technical Skills */}
              <div className={styles.reviewCard}>
                <div className={styles.reviewCardHeader}>
                  <span className={styles.reviewCardTitle}>
                    <Code2 size={15} color="var(--color-primary)" />
                    Skills & Categories
                  </span>
                  <span className={styles.reviewCountBadge}>
                    {(extractedData.parsed_content?.skills || []).reduce((acc, c) => acc + (c.items?.length || 0), 0)} Skills
                  </span>
                </div>
                <div className={styles.reviewCardBody}>
                  {extractedData.parsed_content?.skills?.length > 0 ? (
                    <div className={styles.reviewTagsContainer}>
                      {extractedData.parsed_content.skills.flatMap((cat) => cat.items || []).slice(0, 12).map((skill, i) => (
                        <span key={i} className={styles.reviewTag}>
                          {skill}
                        </span>
                      ))}
                      {(extractedData.parsed_content.skills.flatMap((cat) => cat.items || []).length > 12) && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                          +{extractedData.parsed_content.skills.flatMap((cat) => cat.items || []).length - 12} more
                        </span>
                      )}
                    </div>
                  ) : (
                    <span>No skills categorized.</span>
                  )}
                </div>
              </div>

              {/* Projects */}
              <div className={styles.reviewCard}>
                <div className={styles.reviewCardHeader}>
                  <span className={styles.reviewCardTitle}>
                    <FolderGit2 size={15} color="var(--color-primary)" />
                    Projects
                  </span>
                  <span className={styles.reviewCountBadge}>
                    {extractedData.parsed_content?.projects?.length || 0} Projects
                  </span>
                </div>
                <div className={styles.reviewCardBody}>
                  {extractedData.parsed_content?.projects?.length > 0 ? (
                    <ul className={styles.reviewItemList}>
                      {extractedData.parsed_content.projects.map((proj, i) => (
                        <li key={i} className={styles.reviewItem}>
                          <span>•</span>
                          <span>{proj.name || `Project #${i + 1}`}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <span>No projects detected.</span>
                  )}
                </div>
              </div>

              {/* Experience */}
              <div className={styles.reviewCard}>
                <div className={styles.reviewCardHeader}>
                  <span className={styles.reviewCardTitle}>
                    <Briefcase size={15} color="var(--color-primary)" />
                    Work Experience
                  </span>
                  <span className={styles.reviewCountBadge}>
                    {(extractedData.parsed_content?.work_experience?.length || 0) +
                      (extractedData.parsed_content?.internships?.length || 0)} Roles
                  </span>
                </div>
                <div className={styles.reviewCardBody}>
                  {(extractedData.parsed_content?.work_experience?.length > 0 ||
                    extractedData.parsed_content?.internships?.length > 0) ? (
                    <ul className={styles.reviewItemList}>
                      {extractedData.parsed_content.work_experience?.map((exp, i) => (
                        <li key={`exp-${i}`} className={styles.reviewItem}>
                          <span>•</span>
                          <span>{exp.job_title} at {exp.company_name}</span>
                        </li>
                      ))}
                      {extractedData.parsed_content.internships?.map((intern, i) => (
                        <li key={`int-${i}`} className={styles.reviewItem}>
                          <span>•</span>
                          <span>{intern.position} at {intern.organization} (Intern)</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <span>No employment history detected.</span>
                  )}
                </div>
              </div>
            </div>

            {/* Actions for Review */}
            <div className={styles.actionsRow}>
              <Button
                variant="outline"
                size="md"
                onClick={handleReset}
                icon={RotateCcw}
                disabled={isFinalizing}
              >
                Upload Different Document
              </Button>

              <Button
                variant="primary"
                size="md"
                isLoading={isFinalizing}
                onClick={handleConfirmAndCreate}
                icon={ArrowRight}
              >
                Confirm & Open in Resume Editor
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
