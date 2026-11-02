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
  Check,
  Clock,
  Sparkles,
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
        // Update current version indicator in parent
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
            <History size={18} style={{ color: 'var(--color-primary)' }} />
            <h3 className={styles.title}>Version History</h3>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close history">
            <X size={20} />
          </button>
        </div>

        {/* Create Manual Snapshot Form */}
        <form className={styles.newSnapshotBar} onSubmit={handleCreateSnapshot}>
          <span style={{ fontSize: 'var(--font-xs)', fontWeight: '600', color: 'var(--color-text-secondary)' }}>
            Save Current State as Snapshot
          </span>
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
              <p style={{ fontSize: 'var(--font-sm)', margin: 0 }}>
                No version snapshots saved yet.
              </p>
              <p style={{ fontSize: 'var(--font-xs)', color: 'var(--color-text-muted)', margin: 0 }}>
                Save snapshots above to keep checkpoints of your revisions.
              </p>
            </div>
          ) : (
            versions.map((v) => {
              const isCurrent = v.version_number === currentVersionNumber;
              const isPreviewing = previewVersionId === v.id;
              const summaryText = v.content?.professional_summary?.content;
              const skillsCount = (v.content?.skills || []).reduce(
                (acc, cat) => acc + (cat.items?.length || 0),
                0
              );
              const projectsCount = v.content?.projects?.length || 0;

              return (
                <div key={v.id} className={styles.versionCard}>
                  <div className={styles.versionTopRow}>
                    <div className={styles.versionBadgeGroup}>
                      <span className={styles.versionPill}>v{v.version_number}</span>
                      {isCurrent && <span className={styles.currentPill}>Active Version</span>}
                    </div>
                    <span className={styles.versionTime}>{formatDate(v.created_at)}</span>
                  </div>

                  <p className={styles.versionNote}>{v.change_summary || `Version ${v.version_number}`}</p>

                  <div className={styles.versionMeta}>
                    <span>Template: {v.template || 'Modern'}</span>
                    <span>•</span>
                    <span>{projectsCount} Projects</span>
                    <span>•</span>
                    <span>{skillsCount} Skills</span>
                  </div>

                  {/* Inline Content Preview */}
                  {isPreviewing && (
                    <div className={styles.previewBox}>
                      <div style={{ fontWeight: '600', marginBottom: '4px', color: 'var(--color-text-primary)' }}>
                        Snapshot Summary:
                      </div>
                      <p style={{ margin: '0 0 6px 0', fontStyle: 'italic' }}>
                        {summaryText || '(No summary text recorded in this version)'}
                      </p>
                      <div style={{ color: 'var(--color-text-muted)', fontSize: '0.7rem' }}>
                        Role: {v.target_role || 'General'}
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
                        variant="outline"
                        size="sm"
                        isLoading={restoringId === v.id}
                        disabled={restoringId !== null}
                        onClick={() => handleRestore(v)}
                      >
                        <RotateCcw size={14} /> Restore
                      </Button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

