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
} from 'lucide-react';

export default function ResumeImportPage() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0); // 0 = idle, 1 = upload, 2 = PyMuPDF, 3 = Gemini AI
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
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      notify.error('Please upload a valid PDF document (.pdf)');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      notify.error('File size exceeds the 10MB limit');
      return;
    }
    setSelectedFile(file);
  };

  const handleImport = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setCurrentStep(1);

    // Step simulator for friendly visual feedback while backend and Gemini run
    const stepTimer1 = setTimeout(() => setCurrentStep(2), 900);
    const stepTimer2 = setTimeout(() => setCurrentStep(3), 2200);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await resumeService.importResume(formData);
      const newResume = response;

      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      setCurrentStep(4);

      notify.success('Resume imported successfully! Opening in editor...');
      setTimeout(() => {
        navigate(`/resumes/${newResume.id}/edit`);
      }, 500);
    } catch (err) {
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      setCurrentStep(0);
      setIsProcessing(false);
      notify.error(err.message || 'Failed to import resume. Please try another PDF or create from scratch.');
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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
            <Sparkles size={13} />
            PyMuPDF + Gemini 2.5 Flash
          </span>
        </div>
        <h1 className={styles.title}>Import Existing PDF Resume</h1>
        <p className={styles.subtitle}>
          Upload your existing resume to extract and structure education, skills, projects, and experience directly into our ATS-optimized editor.
        </p>
      </div>

      <div className={styles.card}>
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
              Click to select or drag and drop your PDF resume
            </p>
            <p className={styles.dropzoneSubprompt}>
              Supported format: PDF up to 10MB
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              className={styles.hiddenInput}
              onChange={handleFileChange}
            />
          </div>
        ) : (
          /* File Preview Badge */
          <div className={styles.fileBadge}>
            <div className={styles.fileBadgeLeft}>
              <div className={styles.fileIconBox}>
                <FileText size={22} />
              </div>
              <div>
                <div className={styles.fileName}>{selectedFile.name}</div>
                <div className={styles.fileMeta}>
                  <span className={styles.fileFormatTag}>PDF</span>
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

        {/* Progress Pipeline Indicator */}
        {isProcessing && (
          <div className={styles.progressContainer}>
            <div className={styles.progressTitle}>
              <Sparkles size={16} style={{ color: 'var(--color-primary)' }} />
              <span>Multi-Stage AI Extraction Pipeline</span>
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
                <span>Uploading and validating PDF document...</span>
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
                <span>Extracting raw layout and text streams with PyMuPDF...</span>
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
            <strong>Extraction Note:</strong> Scanned image-only PDFs (without selectable text) cannot be parsed. Missing or omitted sections will remain blank for you to review and complete inside the editor workspace.
          </div>
        </div>

        {/* Action Buttons */}
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
            onClick={handleImport}
            icon={Sparkles}
          >
            Import & Open in Editor
          </Button>
        </div>
      </div>
    </div>
  );
}
