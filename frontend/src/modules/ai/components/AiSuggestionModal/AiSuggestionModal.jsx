import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  AlertTriangle,
  Check,
  X,
  RefreshCw,
  Edit3,
  CheckCircle,
  HelpCircle,
} from 'lucide-react';
import Button from '../../../../components/common/Button/Button';
import styles from './AiSuggestionModal.module.css';

export default function AiSuggestionModal({
  isOpen,
  onClose,
  title = 'AI Content Assistant',
  sectionName = 'Summary',
  originalContent,
  suggestion,
  isLoading = false,
  onAccept,
  onReject,
  onRegenerate,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState('');
  const [customInstructions, setCustomInstructions] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Sync editedText whenever suggestion changes
  useEffect(() => {
    if (suggestion?.suggested_content) {
      if (typeof suggestion.suggested_content === 'string') {
        setEditedText(suggestion.suggested_content);
      } else if (Array.isArray(suggestion.suggested_content)) {
        // e.g. list of bullets
        setEditedText(suggestion.suggested_content.join('\n'));
      } else if (typeof suggestion.suggested_content === 'object') {
        // e.g. project object with description and personally_implemented_features
        if (suggestion.suggested_content.personally_implemented_features) {
          setEditedText(
            suggestion.suggested_content.personally_implemented_features.join('\n')
          );
        } else {
          setEditedText(JSON.stringify(suggestion.suggested_content, null, 2));
        }
      }
    }
    setIsEditing(false);
    setCustomInstructions('');
  }, [suggestion]);

  if (!isOpen) return null;

  const handleAccept = async () => {
    if (!suggestion?.id) return;
    try {
      setActionLoading(true);
      let contentToApply = null;

      if (isEditing) {
        if (typeof suggestion.suggested_content === 'string') {
          contentToApply = editedText;
        } else if (Array.isArray(suggestion.suggested_content)) {
          contentToApply = editedText
            .split('\n')
            .map((s) => s.trim())
            .filter(Boolean);
        } else if (typeof suggestion.suggested_content === 'object') {
          const parsedBullets = editedText
            .split('\n')
            .map((s) => s.trim())
            .filter(Boolean);
          contentToApply = {
            ...suggestion.suggested_content,
            personally_implemented_features: parsedBullets,
          };
        }
      }

      await onAccept(suggestion.id, contentToApply);
      onClose();
    } catch (err) {
      console.error('Failed to accept AI suggestion:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!suggestion?.id) {
      onClose();
      return;
    }
    try {
      setActionLoading(true);
      await onReject(suggestion.id);
      onClose();
    } catch (err) {
      console.error('Failed to reject AI suggestion:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRegenerate = async () => {
    if (!onRegenerate) return;
    try {
      await onRegenerate(customInstructions);
      setCustomInstructions('');
    } catch (err) {
      console.error('Failed to regenerate suggestion:', err);
    }
  };

  // Render original content helper
  const renderOriginal = () => {
    if (!originalContent) {
      return <div className={styles.emptyText}>(No previous content entered)</div>;
    }
    if (typeof originalContent === 'string') {
      return <div>{originalContent}</div>;
    }
    if (Array.isArray(originalContent)) {
      if (originalContent.length === 0) {
        return <div className={styles.emptyText}>(No items entered)</div>;
      }
      return (
        <ul className={styles.bulletsList}>
          {originalContent.map((bullet, idx) => (
            <li key={idx}>{bullet}</li>
          ))}
        </ul>
      );
    }
    if (typeof originalContent === 'object') {
      return (
        <div>
          {originalContent.description && <p>{originalContent.description}</p>}
          {Array.isArray(originalContent.personally_implemented_features) && (
            <ul className={styles.bulletsList}>
              {originalContent.personally_implemented_features.map((b, idx) => (
                <li key={idx}>{b}</li>
              ))}
            </ul>
          )}
        </div>
      );
    }
    return <div>{JSON.stringify(originalContent)}</div>;
  };

  // Render suggested content helper
  const renderSuggested = () => {
    if (!suggestion?.suggested_content) return null;

    if (isEditing) {
      return (
        <textarea
          className={styles.editTextarea}
          value={editedText}
          onChange={(e) => setEditedText(e.target.value)}
          placeholder="Edit suggested content before accepting (one bullet per line for bullet lists)..."
        />
      );
    }

    if (typeof suggestion.suggested_content === 'string') {
      return <div>{suggestion.suggested_content}</div>;
    }

    if (Array.isArray(suggestion.suggested_content)) {
      return (
        <ul className={styles.bulletsList}>
          {suggestion.suggested_content.map((bullet, idx) => (
            <li key={idx}>{bullet}</li>
          ))}
        </ul>
      );
    }

    if (typeof suggestion.suggested_content === 'object') {
      return (
        <div>
          {suggestion.suggested_content.description && (
            <p style={{ marginBottom: '0.75rem', fontWeight: 500 }}>
              {suggestion.suggested_content.description}
            </p>
          )}
          {Array.isArray(suggestion.suggested_content.personally_implemented_features) && (
            <ul className={styles.bulletsList}>
              {suggestion.suggested_content.personally_implemented_features.map((b, idx) => (
                <li key={idx}>{b}</li>
              ))}
            </ul>
          )}
        </div>
      );
    }

    return <div>{JSON.stringify(suggestion.suggested_content)}</div>;
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <div className={styles.headerTitleGroup}>
            <span className={styles.aiBadge}>
              <Sparkles size={14} /> Gemini AI
            </span>
            <h3 className={styles.modalTitle}>{title}</h3>
          </div>
          <button
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className={styles.modalBody}>
          {isLoading ? (
            <div className={styles.loadingState}>
              <div className={styles.loadingSpinner} />
              <h4 className={styles.loadingText}>Generating AI Content Suggestions...</h4>
              <p className={styles.loadingSubtext}>
                Analyzing your technical background and applying action verbs, high-impact phrasing, and ATS optimization.
              </p>
            </div>
          ) : (
            <>
              {/* Factual warnings check */}
              {suggestion?.factual_warnings && suggestion.factual_warnings.length > 0 && (
                <div className={styles.warningBanner}>
                  <AlertTriangle className={styles.warningIcon} size={20} />
                  <div className={styles.warningContent}>
                    <h5 className={styles.warningTitle}>Factual Accuracy Check Required</h5>
                    <ul className={styles.warningList}>
                      {suggestion.factual_warnings.map((warn, i) => (
                        <li key={i}>{warn}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Side-by-side comparison */}
              <div className={styles.comparisonGrid}>
                <div className={styles.comparisonCol}>
                  <div className={styles.colHeader}>
                    <span>Current / Original</span>
                  </div>
                  <div className={styles.originalBox}>{renderOriginal()}</div>
                </div>

                <div className={styles.comparisonCol}>
                  <div className={styles.colHeader}>
                    <span>AI Suggested</span>
                    <button
                      type="button"
                      onClick={() => setIsEditing(!isEditing)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--color-primary)',
                        cursor: 'pointer',
                        fontSize: 'var(--font-xs)',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <Edit3 size={13} />
                      {isEditing ? 'Cancel Edit' : 'Edit Manually'}
                    </button>
                  </div>
                  <div className={styles.suggestedBox}>{renderSuggested()}</div>
                </div>
              </div>

              {/* Changes rationale */}
              {suggestion?.changes && (
                <div className={styles.changesBox}>
                  <CheckCircle className={styles.changesIcon} size={16} />
                  <div>
                    <strong>Changes Made: </strong>
                    {suggestion.changes}
                  </div>
                </div>
              )}

              {/* Request Revision Form */}
              <div className={styles.revisionSection}>
                <label className={styles.revisionLabel}>
                  Need adjustments? Give custom instructions:
                </label>
                <div className={styles.revisionInputRow}>
                  <input
                    type="text"
                    className={styles.revisionInput}
                    placeholder="e.g. Focus more on backend scalability, make bullet points shorter..."
                    value={customInstructions}
                    onChange={(e) => setCustomInstructions(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleRegenerate();
                      }
                    }}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRegenerate}
                    disabled={isLoading || actionLoading}
                  >
                    <RefreshCw size={14} /> Re-run
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className={styles.modalFooter}>
          <div className={styles.footerLeft}>
            <Button
              variant="outline"
              size="md"
              onClick={handleReject}
              disabled={isLoading || actionLoading}
            >
              <X size={16} /> Reject
            </Button>
          </div>

          <div className={styles.footerRight}>
            <Button
              variant="primary"
              size="md"
              onClick={handleAccept}
              disabled={isLoading || actionLoading || !suggestion}
            >
              <Check size={16} /> {isEditing ? 'Accept Edited Content' : 'Accept Suggestion'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
