import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styles from './ResumeCard.module.css';
import Button from '../../../../components/common/Button/Button';
import {
  Briefcase,
  Calendar,
  MoreVertical,
  Copy,
  Edit2,
  Trash2,
  ExternalLink,
} from 'lucide-react';

export default function ResumeCard({
  resume,
  onDuplicate,
  onRename,
  onDelete,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [menuOpen]);

  const formatDate = (isoString) => {
    if (!isoString) return 'Recently';
    const date = new Date(isoString);
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className={styles.card}>
      <div>
        <div className={styles.topRow}>
          <div className={styles.badgeRow}>
            <span className={styles.templateBadge}>{resume.template || 'Modern'}</span>
            <span className={styles.versionBadge}>v{resume.current_version || 1}</span>
            <span className={`${styles.statusBadge} ${resume.status === 'completed' ? styles.completed : styles.draft}`}>
              <span className={styles.statusDot} />
              {resume.status === 'completed' ? 'Completed' : 'Draft'}
            </span>
          </div>
        </div>

        <div className={styles.titleArea}>
          <h3 className={styles.title}>{resume.title}</h3>
          <p className={styles.targetRole}>
            <Briefcase size={14} />
            <span>{resume.target_role || 'Target Role Not Specified'}</span>
          </p>
        </div>
      </div>

      <div className={styles.metaRow}>
        <Calendar size={13} />
        <span>Updated {formatDate(resume.updated_at)}</span>
      </div>

      <div className={styles.actionRow}>
        <div className={styles.primaryActions}>
          <Link to={`/resumes/${resume.id}/edit`}>
            <Button variant="primary" size="sm">
              Edit
            </Button>
          </Link>
          <Link to={`/resumes/${resume.id}/preview`}>
            <Button variant="outline" size="sm" icon={ExternalLink}>
              Preview
            </Button>
          </Link>
        </div>

        <div className={styles.moreMenuWrapper} ref={menuRef}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="More resume actions"
          >
            <MoreVertical size={16} />
          </Button>

          {menuOpen && (
            <div className={styles.menuDropdown}>
              <button
                type="button"
                className={styles.menuItem}
                onClick={() => {
                  setMenuOpen(false);
                  onDuplicate(resume.id);
                }}
              >
                <Copy size={14} />
                <span>Duplicate</span>
              </button>

              <button
                type="button"
                className={styles.menuItem}
                onClick={() => {
                  setMenuOpen(false);
                  onRename(resume);
                }}
              >
                <Edit2 size={14} />
                <span>Rename</span>
              </button>

              <button
                type="button"
                className={`${styles.menuItem} ${styles.deleteItem}`}
                onClick={() => {
                  setMenuOpen(false);
                  onDelete(resume);
                }}
              >
                <Trash2 size={14} />
                <span>Delete</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
