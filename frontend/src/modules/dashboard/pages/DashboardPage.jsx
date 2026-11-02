import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import styles from './DashboardPage.module.css';
import ResumeCard from '../components/ResumeCard/ResumeCard';
import CreateResumeModal from '../../resume/components/CreateResumeModal/CreateResumeModal';
import RenameModal from '../../resume/components/RenameModal/RenameModal';
import DeleteModal from '../../resume/components/DeleteModal/DeleteModal';
import Button from '../../../components/common/Button/Button';
import Loader from '../../../components/common/Loader/Loader';
import { useAuth } from '../../../context/AuthContext';
import { useNotification } from '../../../context/NotificationContext';
import { resumeService } from '../../resume/services/resumeService';
import { profileService } from '../../profile/services/profileService';
import {
  FileText,
  PlusCircle,
  Award,
  Sparkles,
  Clock,
  ArrowRight,
  FolderOpen,
} from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();
  const { success, error } = useNotification();
  const location = useLocation();
  const navigate = useNavigate();

  const isCreateRoute = location.pathname === '/resumes/create';

  const [resumes, setResumes] = useState([]);
  const [profileCompletion, setProfileCompletion] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(isCreateRoute);
  const [renameTarget, setRenameTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    if (isCreateRoute) {
      setCreateModalOpen(true);
    }
  }, [isCreateRoute]);

  const loadDashboardData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [resumesData, profileData] = await Promise.all([
        resumeService.getResumes(),
        profileService.getProfile().catch(() => null),
      ]);

      setResumes(resumesData || []);

      if (profileData) {
        let score = 0;
        if (profileData.personal_info?.full_name && profileData.personal_info?.email) score += 20;
        if (profileData.education?.length) score += 20;
        if (profileData.skills?.some((s) => s.items?.length)) score += 20;
        if (profileData.projects?.length) score += 20;
        if (profileData.work_experience?.length) score += 20;
        setProfileCompletion(score);
      }
    } catch (err) {
      error(err.message || 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  }, [error]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const handleDuplicate = async (resumeId) => {
    try {
      const duplicated = await resumeService.duplicateResume(resumeId);
      success(`Duplicated as "${duplicated.title}"`);
      setResumes((prev) => [duplicated, ...prev]);
    } catch (err) {
      error(err.message || 'Failed to duplicate resume');
    }
  };

  const handleResumeRenamed = (updatedResume) => {
    setResumes((prev) =>
      prev.map((r) => (r.id === updatedResume.id ? { ...r, title: updatedResume.title } : r))
    );
  };

  const handleResumeDeleted = (deletedId) => {
    setResumes((prev) => prev.filter((r) => r.id !== deletedId));
  };

  const handleResumeCreated = (newResume) => {
    setResumes((prev) => [newResume, ...prev]);
  };

  if (isLoading) {
    return <Loader fullPage message="Loading student dashboard..." />;
  }

  return (
    <div className={styles.dashboardContainer}>
      {/* Overview Header */}
      <div className={styles.overviewHeader}>
        <div>
          <h1 className={styles.title}>
            Welcome back, {user?.full_name?.split(' ')[0] || 'Student'}! 👋
          </h1>
          <p className={styles.subtitle}>
            Manage, customize, and build job-ready resumes for your career applications.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          icon={PlusCircle}
          onClick={() => setCreateModalOpen(true)}
        >
          Create New Resume
        </Button>
      </div>

      {/* Overview Metrics Cards */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <FileText size={24} />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statLabel}>Total Resumes</span>
            <span className={styles.statValue}>{resumes.length}</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ backgroundColor: 'var(--success-50)', color: 'var(--success-600)' }}>
            <Award size={24} />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statLabel}>Profile Strength</span>
            <span className={styles.statValue}>{profileCompletion}%</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ backgroundColor: 'var(--warning-50)', color: 'var(--warning-600)' }}>
            <Clock size={24} />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statLabel}>Recent Activity</span>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--slate-800)' }}>
              {resumes.length ? `${resumes[0].title}` : 'No resumes yet'}
            </span>
          </div>
        </div>
      </div>

      {/* Resumes Section */}
      <div>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Your Resumes</h2>
          {profileCompletion < 100 && (
            <Link to="/profile" style={{ fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <span>Complete Profile for Faster Resume Building</span>
              <ArrowRight size={14} />
            </Link>
          )}
        </div>

        {resumes.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <FolderOpen size={32} />
            </div>
            <h3 className={styles.emptyTitle}>You haven't created any resumes yet</h3>
            <p className={styles.emptyDesc}>
              Start building your first resume from scratch with ATS-optimized templates, or import an existing PDF resume to get started in seconds.
            </p>
            <Button
              variant="primary"
              size="md"
              icon={PlusCircle}
              onClick={() => setCreateModalOpen(true)}
            >
              Create Your First Resume
            </Button>
          </div>
        ) : (
          <div className={styles.resumeGrid}>
            {resumes.map((resume) => (
              <ResumeCard
                key={resume.id}
                resume={resume}
                onDuplicate={handleDuplicate}
                onRename={(res) => setRenameTarget(res)}
                onDelete={(res) => setDeleteTarget(res)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateResumeModal
        isOpen={createModalOpen}
        onClose={() => {
          setCreateModalOpen(false);
          if (isCreateRoute) navigate('/dashboard');
        }}
        onCreated={handleResumeCreated}
      />

      <RenameModal
        isOpen={!!renameTarget}
        onClose={() => setRenameTarget(null)}
        resume={renameTarget}
        onRenamed={handleResumeRenamed}
      />

      <DeleteModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        resume={deleteTarget}
        onDeleted={handleResumeDeleted}
      />
    </div>
  );
}
