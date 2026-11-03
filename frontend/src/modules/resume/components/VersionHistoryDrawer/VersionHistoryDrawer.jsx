import React, { useState, useEffect, useCallback } from 'react';
import styles from './VersionHistoryDrawer.module.css';
import Button from '../../../../components/common/Button/Button';
import Loader from '../../../../components/common/Loader/Loader';
import versionService from '../../services/versionService';
import { useNotification } from '../../../../context/NotificationContext';
import {
  History,
  X,
  Plus,
  RotateCcw,
  Eye,
  EyeOff,
  Clock,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';

export default function VersionHistoryDrawer({
  isOpen,
  onClose,
  resumeId,
  currentVersionNumber,
  onRestore,
}) {
  const [versions, setVersions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newNote, setNewNote] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [restoringId, setRestoringId] = useState(null);
  const [previewVersionId, setPreviewVersionId] = useState(null);

  const notify = useNotification();

  const loadVersions = useCallback(async () => {
    if (!resumeId) return;
    setIsLoading(true);
    try {
      const data = await versionService.getVersions(resumeId);
      setVersions(data || []);
    } catch (err) {
      notify.error(err.message || 'Failed to load version history');
    } finally {
      setIsLoading(false);
    }
  }, [resumeId, notify]);

  useEffect(() => {
    if (isOpen) {
      loadVersions();
      setPreviewVersionId(null);
      setNewNote('');
    }
  }, [isOpen, loadVersions]);

  if (!isOpen) return null;

  const handleCreateSnapshot = async (e) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      const newSnapshot = await versionService.createVersion(resumeId, newNote.trim());
      notify.success(`Snapshot v${newSnapshot.version_number} saved!`);
      setNewNote('');
      await loadVersions();
      if (onRestore) {
        onRestore({ current_version: newSnapshot.version_number });
      }
    } catch (err) {
      notify.error(err.message || 'Failed to create version snapshot');
    } finally {
      setIsCreating(false);
    }
  };

  const handleRestore = async (version) => {
    const confirmMessage = `Restore to Version ${version.version_number} ("${version.change_summary}")?\n\nThis will create a new sequential active version with this content, preserving your entire revision history.`;
    if (!window.confirm(confirmMessage)) return;

    setRestoringId(version.id);
    try {
      const res = await versionService.restoreVersion(resumeId, version.id);
      notify.success(`Restored to new Version ${res.active_resume.current_version}!`);
      await loadVersions();
      if (onRestore) {
        onRestore(res.active_resume);
      }
      onClose();
    } catch (err) {
      notify.error(err.message || 'Failed to restore version');
    } finally {
      setRestoringId(null);
    }
  };

  const formatDate = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.drawer} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerTitleGroup}>
            <div className={styles.headerIconCircle}>
              <History size={18} />
            </div>
            <div>
              <h3 className={styles.title}>Version History</h3>
              <p className={styles.subtitle}>Audit revisions & rollback at any time</p>
            </div>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close history">
            <X size={20} />
          </button>
        </div>

        {/* Create Manual Snapshot Form */}
        <form className={styles.newSnapshotBar} onSubmit={handleCreateSnapshot}>
          <div className={styles.snapshotLabelRow}>
            <span className={styles.snapshotLabel}>Save Current State Checkpoint</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-primary)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
              <Sparkles size={12} /> Auto-numbered
            </span>
          </div>
          <div className={styles.snapshotInputRow}>
            <input
              type="text"
              className={styles.snapshotInput}
              placeholder="e.g. Tailored for Google, added cloud projects..."
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              disabled={isCreating}
            />
            <Button
              variant="primary"
              size="sm"
              icon={Plus}
              isLoading={isCreating}
              disabled={isCreating}
            >
              Save
            </Button>
          </div>
        </form>

        {/* Versions Timeline List */}
        <div className={styles.contentBody}>
          {isLoading ? (
            <Loader message="Loading version history..." />
          ) : versions.length === 0 ? (
            <div className={styles.emptyState}>
              <Clock size={36} style={{ opacity: 0.5 }} />
              <p style={{ fontSize: '0.875rem', fontWeight: 600, margin: 0, color: 'var(--color-text-primary)' }}>
                No version snapshots saved yet
              </p>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: 0 }}>
                Save snapshots above to keep milestones of your resume edits.
              </p>
            </div>
          ) : (
            <div className={styles.timelineTrack}>
              {versions.map((v) => {
                const isCurrent = v.version_number === currentVersionNumber;
                const isPreviewing = previewVersionId === v.id;
                const summaryText = v.content?.professional_summary?.content;
                const candidateName = v.content?.personal_info?.full_name;
                const skillsCount = (v.content?.skills || []).reduce(
                  (acc, cat) => acc + (cat.items?.length || 0),
                  0
                );
                const projectsCount = v.content?.projects?.length || 0;
                const expCount = (v.content?.work_experience?.length || 0) + (v.content?.internships?.length || 0);

                return (
                  <div key={v.id} className={styles.timelineItem}>
                    <div className={`${styles.timelineDot} ${isCurrent ? styles.timelineDotActive : ''}`} />

                    <div className={`${styles.versionCard} ${isCurrent ? styles.activeVersionCard : ''}`}>
                      <div className={styles.versionTopRow}>
                        <div className={styles.versionBadgeGroup}>
                          <span className={styles.versionPill}>v{v.version_number}</span>
                          {isCurrent && (
                            <span className={styles.currentPill}>
                              <span className={styles.currentPulse} />
                              Active
                            </span>
                          )}
                        </div>
                        <span className={styles.versionTime}>{formatDate(v.created_at)}</span>
                      </div>

                      <p className={styles.versionNote}>{v.change_summary || `Version ${v.version_number}`}</p>

                      <div className={styles.versionMeta}>
                        <span className={styles.metaPill}>Template: <strong>{v.template || 'Modern'}</strong></span>
                        <span>•</span>
                        <span className={styles.metaPill}>{projectsCount} Projects</span>
                        <span>•</span>
                        <span className={styles.metaPill}>{expCount} Exp</span>
                        <span>•</span>
                        <span className={styles.metaPill}>{skillsCount} Skills</span>
                      </div>

                      {/* Inline Content Preview */}
                      {isPreviewing && (
                        <div className={styles.previewBox}>
                          <div className={styles.previewHeading}>Snapshot Details:</div>
                          {candidateName && (
                            <div>
                              <strong>Name:</strong> {candidateName}
                            </div>
                          )}
                          <div>
                            <strong>Target Role:</strong> {v.target_role || 'Not specified'}
                          </div>
                          <div>
                            <strong>Summary:</strong>
                            <div className={styles.previewSummary}>
                              {summaryText || '(No professional summary recorded)'}
                            </div>
                          </div>
                        </div>
                      )}

                      <div className={styles.versionActions}>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setPreviewVersionId(isPreviewing ? null : v.id)}
                        >
                          {isPreviewing ? <EyeOff size={14} /> : <Eye size={14} />}
                          {isPreviewing ? 'Hide Preview' : 'Preview'}
                        </Button>

                        {!isCurrent && (
                          <Button
                            variant="primary"
                            size="sm"
                            isLoading={restoringId === v.id}
                            disabled={restoringId !== null}
                            onClick={() => handleRestore(v)}
                            icon={RotateCcw}
                          >
                            Restore
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
