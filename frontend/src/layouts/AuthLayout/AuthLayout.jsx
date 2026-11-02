import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import styles from './AuthLayout.module.css';
import { FileText, Sparkles, CheckCircle2 } from 'lucide-react';

export default function AuthLayout() {
  return (
    <div className={styles.authContainer}>
      <div className={styles.brandSide}>
        <div className={styles.brandContent}>
          <div className={styles.brandHeader}>
            <div className={styles.logoIcon}>
              <FileText size={28} />
              <Sparkles size={16} className={styles.sparkleIcon} />
            </div>
            <h1 className={styles.brandTitle}>
              Career<span className={styles.brandHighlight}>AI</span>
            </h1>
          </div>
          <p className={styles.brandTagline}>
            Craft standout, job-ready resumes tailored for internships, fresh graduates, and tech careers.
          </p>

          <ul className={styles.featureList}>
            <li className={styles.featureItem}>
              <CheckCircle2 size={18} className={styles.checkIcon} />
              <span>Standardized ATS-compliant formatting & templates</span>
            </li>
            <li className={styles.featureItem}>
              <CheckCircle2 size={18} className={styles.checkIcon} />
              <span>AI-assisted bullet points without hallucinated facts</span>
            </li>
            <li className={styles.featureItem}>
              <CheckCircle2 size={18} className={styles.checkIcon} />
              <span>Instant PDF import & PyMuPDF text structuring</span>
            </li>
            <li className={styles.featureItem}>
              <CheckCircle2 size={18} className={styles.checkIcon} />
              <span>Full version history & rollback snapshots</span>
            </li>
          </ul>
        </div>
      </div>

      <div className={styles.formSide}>
        <div className={styles.formCard}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}

