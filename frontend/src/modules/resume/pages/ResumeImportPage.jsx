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
  ArrowRight,
  ShieldCheck,
  Zap,
  TrendingUp,
} from 'lucide-react';

const ALLOWED_EXTENSIONS = ['.pdf', '.docx', '.doc'];

export default function ResumeImportPage() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState(1);
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
  };

  const getFileFormat = (fileName) => {
    if (!fileName) return 'FILE';
    return fileName.split('.').pop().toUpperCase();
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleUploadAndAnalyze = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setProcessingStep(1);

    const timer1 = setTimeout(() => setProcessingStep(2), 1200);
    const timer2 = setTimeout(() => setProcessingStep(3), 2600);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      // Directly create resume from document in single step
      const newResume = await resumeService.importResume(formData);
      clearTimeout(timer1);
      clearTimeout(timer2);
      setProcessingStep(3);

      notify.success('Resume parsed successfully! Opening your Analytics Dashboard...');
      setTimeout(() => {
        navigate(`/resumes/${newResume.id}/analysis?autoAnalyze=1`);
      }, 500);
    } catch (err) {
      clearTimeout(timer1);
      clearTimeout(timer2);
      setIsProcessing(false);
      notify.error(err.message || 'Failed to parse resume document. Please try again.');
    }
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
            AI Instant Resume Analytics
          </span>
          <span className={styles.formatBadge}>PDF</span>
          <span className={styles.formatBadge}>DOCX</span>
          <span className={styles.formatBadge}>DOC</span>
        </div>
        <h1 className={styles.title}>Upload Resume for Instant Analytics</h1>
        <p className={styles.subtitle}>
          Upload your existing resume to instantly view your ATS compatibility score, section strengths, and access a pre-built AI improved version.
        </p>
      </div>

      {/* Main Upload Card */}
      <div className={styles.card}>
        {!isProcessing ? (
          <>
            {/* Dropzone */}
            <div
              className={`${styles.dropzone} ${isDragging ? styles.dragging : ''} ${
                selectedFile ? styles.hasFile : ''
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.doc"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />

              <div className={styles.dropzoneIconWrapper}>
                <Upload size={32} />
              </div>

              <div className={styles.dropzoneContent}>
                <p className={styles.dropzoneMainText}>
                  {selectedFile ? 'Change resume file' : 'Drag & drop your resume file here, or click to browse'}
                </p>
                <p className={styles.dropzoneSubText}>
                  Supports PDF (.pdf), Word (.docx, .doc) &bull; Maximum file size 10MB
                </p>
              </div>
            </div>

            {/* Selected File Details & Action */}
            {selectedFile && (
              <div className={styles.fileSelectedBox}>
                <div className={styles.fileInfoGroup}>
                  <div className={styles.fileFormatTag}>{getFileFormat(selectedFile.name)}</div>
                  <div className={styles.fileMetaText}>
                    <span className={styles.fileName}>{selectedFile.name}</span>
                    <span className={styles.fileSize}>{formatFileSize(selectedFile.size)}</span>
                  </div>
                </div>

                <button
                  type="button"
                  className={styles.removeFileBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedFile(null);
                  }}
                  title="Remove selected file"
                >
                  <X size={16} />
                </button>
              </div>
            )}

            {/* Submit Action */}
            <div className={styles.actionRow}>
              <Button
                variant="primary"
                size="lg"
                icon={Sparkles}
                disabled={!selectedFile}
                onClick={handleUploadAndAnalyze}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                Upload & View Analytics Now
              </Button>
            </div>

            {/* Benefits Feature Strip */}
            <div className={styles.featureStrip}>
              <div className={styles.featureItem}>
                <ShieldCheck size={18} className={styles.featureIcon} />
                <span>Instant ATS Compatibility Score</span>
              </div>
              <div className={styles.featureItem}>
                <TrendingUp size={18} className={styles.featureIcon} />
                <span>Section-by-Section Strengths</span>
              </div>
              <div className={styles.featureItem}>
                <Zap size={18} className={styles.featureIcon} />
                <span>Pre-Built AI Improved Version</span>
              </div>
            </div>
          </>
        ) : (
          /* Processing State */
          <div className={styles.processingState}>
            <div className={styles.spinnerCircle}>
              <Sparkles size={36} className={styles.pulseSparkle} />
            </div>

            <h3 className={styles.processingTitle}>
              {processingStep === 1 && 'Extracting Resume Content...'}
              {processingStep === 2 && 'Structuring Data with AI...'}
              {processingStep === 3 && 'Generating ATS Score & Analytics...'}
            </h3>

            <p className={styles.processingDesc}>
              Parsing sections, evaluating readability, and computing role alignment benchmarks.
            </p>

            <div className={styles.stepIndicators}>
              <div className={`${styles.stepDot} ${processingStep >= 1 ? styles.activeDot : ''}`}>
                <span className={styles.dotCircle}>1</span>
                <span>Upload & Parse</span>
              </div>
              <div className={styles.stepLine} />
              <div className={`${styles.stepDot} ${processingStep >= 2 ? styles.activeDot : ''}`}>
                <span className={styles.dotCircle}>2</span>
                <span>AI Structuring</span>
              </div>
              <div className={styles.stepLine} />
              <div className={`${styles.stepDot} ${processingStep >= 3 ? styles.activeDot : ''}`}>
                <span className={styles.dotCircle}>3</span>
                <span>Dashboard</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
