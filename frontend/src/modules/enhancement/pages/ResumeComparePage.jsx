import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Edit3,
  Check,
  TrendingUp,
  FileText,
  Save,
  RotateCcw,
  Sliders,
  Layers,
  Wand2,
  Eye,
  X,
  Copy,
  GitBranch,
} from 'lucide-react';
import styles from './ResumeComparePage.module.css';
import Button from '../../../components/common/Button/Button';
import Modal from '../../../components/common/Modal/Modal';
import Loader from '../../../components/common/Loader/Loader';
import { useNotification } from '../../../context/NotificationContext';
import { resumeService } from '../../resume/services/resumeService';
import { enhancementService } from '../services/enhancementService';
import TemplateRenderer from '../../templates/TemplateRenderer';

export default function ResumeComparePage() {
  const { id: resumeId } = useParams();
  const navigate = useNavigate();
  const notify = useNotification();

  const [resume, setResume] = useState(null);
  const [enhancementData, setEnhancementData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

  // Enhancement generation options state
  const [targetRole, setTargetRole] = useState('');
  const [customInstructions, setCustomInstructions] = useState('');

  // Active comparison state
  const [activeSectionKey, setActiveSectionKey] = useState('professional_summary');
  const [acceptedSections, setAcceptedSections] = useState({});
  const [customEdits, setCustomEdits] = useState({});
  const [isEditingCurrent, setIsEditingCurrent] = useState(false);
  const [editTextVal, setEditTextVal] = useState('');

  // Modals state
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [applyMode, setApplyMode] = useState('new_version'); // 'new_version', 'new_resume', 'replace'
  const [newResumeTitle, setNewResumeTitle] = useState('');
  const [fullPreviewModalOpen, setFullPreviewModalOpen] = useState(false);

  // Load resume & latest enhancement
  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        setIsLoading(true);
        const resDoc = await resumeService.getResume(resumeId);
        if (!isMounted) return;
        setResume(resDoc);
        setTargetRole(resDoc.target_role || '');
        setNewResumeTitle(`${resDoc.title || 'Resume'} (AI Improved)`);

        try {
          const enhDoc = await enhancementService.getLatestEnhancement(resumeId);
          if (enhDoc && enhDoc.improved_content) {
            setEnhancementData(enhDoc);
            // Default: initialize all available sections as accepted
            const initialAccepted = {};
            (enhDoc.section_diffs || []).forEach((d) => {
              initialAccepted[d.section] = true;
            });
            setAcceptedSections(initialAccepted);
            if (enhDoc.section_diffs?.[0]?.section) {
              setActiveSectionKey(enhDoc.section_diffs[0].section);
            }
          }
        } catch (err) {
          // No enhancement exists yet
        }
      } catch (err) {
        notify.error('Failed to load resume details.');
        navigate('/dashboard');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, [resumeId]);

  const handleGenerate = async () => {
    try {
      setIsGenerating(true);
      const res = await enhancementService.generateEnhancement(resumeId, {
        target_role: targetRole,
        custom_instructions: customInstructions,
      });
      setEnhancementData(res);

      // Reset acceptance map to all true for fresh enhancement
      const newAccepted = {};
      (res.section_diffs || []).forEach((d) => {
        newAccepted[d.section] = true;
      });
      setAcceptedSections(newAccepted);
      setCustomEdits({});
      setIsEditingCurrent(false);
      if (res.section_diffs?.[0]?.section) {
        setActiveSectionKey(res.section_diffs[0].section);
      }
      notify.success('AI Resume Enhancement generated successfully!');
    } catch (err) {
      notify.error(err.message || 'Enhancement failed. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleToggleSectionAccept = (secKey, accept) => {
    setAcceptedSections((prev) => ({
      ...prev,
      [secKey]: accept,
    }));
  };

  const handleAcceptAll = () => {
    const allAccepted = {};
    (enhancementData?.section_diffs || []).forEach((d) => {
      allAccepted[d.section] = true;
    });
    setAcceptedSections(allAccepted);
    notify.info('All sections marked to accept AI enhancements.');
  };

  const handleRejectAll = () => {
    const allRejected = {};
    (enhancementData?.section_diffs || []).forEach((d) => {
      allRejected[d.section] = false;
    });
    setAcceptedSections(allRejected);
    notify.info('All sections set to keep original content.');
  };

  const handleStartEditing = (improvedVal) => {
    setIsEditingCurrent(true);
    setEditTextVal(
      typeof improvedVal === 'string'
        ? improvedVal
        : JSON.stringify(improvedVal, null, 2)
    );
  };

  const handleSaveCustomEdit = (secKey) => {
    try {
      let parsed = editTextVal;
      if (editTextVal.trim().startsWith('{') || editTextVal.trim().startsWith('[')) {
        parsed = JSON.parse(editTextVal);
      }
      setCustomEdits((prev) => ({
        ...prev,
        [secKey]: parsed,
      }));
      setAcceptedSections((prev) => ({ ...prev, [secKey]: true }));
      setIsEditingCurrent(false);
      notify.success('Custom edits saved for this section.');
    } catch (err) {
      notify.error('Invalid JSON structure in manual edit. Please check syntax.');
    }
  };

  const handleApplyConfirmed = async () => {
    try {
      setIsApplying(true);
      const res = await enhancementService.applyEnhancement(resumeId, {
        mode: applyMode,
        accepted_sections: acceptedSections,
        custom_content: customEdits,
        title_for_new_resume: newResumeTitle,
      });

      notify.success(res.message || 'Enhancement applied successfully!');
      setApplyModalOpen(false);

      const targetId = res.resume_id || resumeId;
      navigate(`/resumes/${targetId}/edit`);
    } catch (err) {
      notify.error(err.message || 'Failed to apply enhancement.');
    } finally {
      setIsApplying(false);
    }
  };

  // Active section data
  const currentDiff = useMemo(() => {
    if (!enhancementData?.section_diffs) return null;
    return enhancementData.section_diffs.find((d) => d.section === activeSectionKey) || enhancementData.section_diffs[0];
  }, [enhancementData, activeSectionKey]);

  // Construct synthetic resume objects for full side-by-side preview
  const originalPreviewResume = useMemo(() => {
    if (!resume) return null;
    return {
      ...resume,
      content: enhancementData?.original_content || resume.content,
    };
  }, [resume, enhancementData]);

  const improvedPreviewResume = useMemo(() => {
    if (!resume || !enhancementData) return null;
    const merged = { ...(enhancementData.original_content || resume.content) };
    Object.keys(acceptedSections).forEach((k) => {
      if (acceptedSections[k]) {
        merged[k] = customEdits[k] || enhancementData.improved_content?.[k] || merged[k];
      }
    });
    return {
      ...resume,
      title: `${resume.title} (Improved)`,
      content: merged,
    };
  }, [resume, enhancementData, acceptedSections, customEdits]);

  if (isLoading) {
    return <Loader fullPage message="Loading AI Resume Improver workspace..." />;
  }

  return (
    <div className={styles.comparePage}>
      <div className={styles.innerWrapper}>
        {/* Top Header Bar */}
        <div className={styles.topBar}>
          <div className={styles.barLeft}>
            <Link to={`/resumes/${resumeId}/analysis`} className={styles.backBtn} title="Return to Analysis">
              <ArrowLeft size={18} />
            </Link>
            <div className={styles.headerTitleArea}>
              <div className={styles.headerTitleRow}>
                <h1 className={styles.pageTitle}>{resume?.title || 'Resume'} — AI Improver</h1>
                {targetRole && (
                  <span className={styles.targetRoleBadge}>
                    <Sparkles size={12} />
                    Target: {targetRole}
                  </span>
                )}
              </div>
              <p className={styles.headerSubtitle}>
                Side-by-side comparison, section-by-section approval, and granular editing
              </p>
            </div>
          </div>

          <div className={styles.barRight}>
            {enhancementData && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  icon={RotateCcw}
                  isLoading={isGenerating}
                  onClick={handleGenerate}
                >
                  Re-Enhance
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  icon={Eye}
                  onClick={() => setFullPreviewModalOpen(true)}
                >
                  Full Preview Comparison
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  icon={CheckCircle2}
                  onClick={() => setApplyModalOpen(true)}
                >
                  Apply & Save Improvements
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Empty State / Not Generated Yet */}
        {!enhancementData && !isGenerating && (
          <div style={{ background: 'white', borderRadius: 'var(--radius-2xl)', border: '1px solid var(--slate-200)', padding: '3.5rem 2rem', textAlign: 'center', maxWidth: '640px', margin: '2rem auto' }}>
            <div style={{ width: '70px', height: '70px', borderRadius: '50%', background: 'var(--primary-50)', color: 'var(--primary-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
              <Wand2 size={36} />
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--slate-900)', marginBottom: '0.5rem' }}>
              Generate Your AI-Enhanced Resume
            </h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--slate-600)', lineHeight: 1.55, marginBottom: '2rem' }}>
              Our AI will elevate your professional summary, upgrade bullet points with strong action verbs and quantifiable results, organize technical skills, and optimize phrasing for ATS parsing without inventing facts.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '420px', margin: '0 auto', textAlign: 'left' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--slate-700)', display: 'block', marginBottom: '0.35rem' }}>
                  Target Role / Specialization
                </label>
                <input
                  type="text"
                  placeholder="e.g. Senior Full Stack Engineer"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  style={{ width: '100%', padding: '0.7rem 0.9rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--slate-300)', fontSize: '0.875rem' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--slate-700)', display: 'block', marginBottom: '0.35rem' }}>
                  Custom Guidance (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Focus on microservices and cloud infrastructure impact..."
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                  style={{ width: '100%', padding: '0.7rem 0.9rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--slate-300)', fontSize: '0.875rem', resize: 'none' }}
                />
              </div>
              <Button
                variant="primary"
                size="lg"
                icon={Sparkles}
                onClick={handleGenerate}
              >
                Generate AI Improvements
              </Button>
            </div>
          </div>
        )}

        {/* Scanning State */}
        {isGenerating && (
          <div style={{ background: 'white', borderRadius: 'var(--radius-2xl)', border: '1px solid var(--slate-200)', padding: '4rem 2rem', textAlign: 'center' }}>
            <div style={{ position: 'relative', width: '64px', height: '64px', margin: '0 auto 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sparkles size={40} color="var(--primary-600)" />
            </div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--slate-900)', margin: '0 0 0.5rem' }}>
              Polishing Your Resume with Gemini AI...
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--slate-500)', maxWidth: '440px', margin: '0 auto' }}>
              Refactoring bullet points to XYZ impact format, polishing executive summary hook, and ensuring strict factual integrity.
            </p>
          </div>
        )}

        {/* Main Workspace Layout */}
        {enhancementData && !isGenerating && (
          <>
            {/* Executive Summary Banner */}
            <div className={styles.summaryBanner}>
              <div className={styles.summaryLeft}>
                <div className={styles.summaryIconCircle}>
                  <Sparkles size={22} />
                </div>
                <div>
                  <h3 className={styles.summaryHeading}>AI Enhancement Overview</h3>
                  <p className={styles.summaryText}>{enhancementData.enhancement_summary}</p>
                </div>
              </div>
              <div className={styles.summaryRight}>
                <div className={styles.boostBadge}>
                  <TrendingUp size={16} />
                  +{enhancementData.estimated_score_improvement || 15} pts Score Boost
                </div>
                <Button variant="outline" size="sm" onClick={handleAcceptAll}>
                  Accept All
                </Button>
                <Button variant="ghost" size="sm" onClick={handleRejectAll}>
                  Reset All
                </Button>
              </div>
            </div>

            {/* Split Workspace */}
            <div className={styles.workspaceLayout}>
              {/* Left Section Navigation Sidebar */}
              <div className={styles.sectionSidebar}>
                <span className={styles.sidebarTitle}>Sections ({enhancementData.section_diffs?.length || 0})</span>
                {(enhancementData.section_diffs || []).map((diff) => {
                  const isAccepted = acceptedSections[diff.section] !== false;
                  const isEdited = !!customEdits[diff.section];
                  const isActive = activeSectionKey === diff.section;

                  return (
                    <button
                      key={diff.section}
                      type="button"
                      className={`${styles.sidebarBtn} ${isActive ? styles.sidebarBtnActive : ''}`}
                      onClick={() => {
                        setActiveSectionKey(diff.section);
                        setIsEditingCurrent(false);
                      }}
                    >
                      <div className={styles.sidebarBtnLeft}>
                        <span className={styles.sidebarSectionName}>{diff.title}</span>
                        <span className={styles.sidebarSectionMeta}>
                          {diff.impact === 'high' ? 'High Impact' : 'Standard'}
                        </span>
                      </div>
                      <div>
                        {isEdited ? (
                          <span className={styles.sidebarBadgeAccepted} style={{ background: '#dbeafe', color: '#1e40af' }}>
                            Edited
                          </span>
                        ) : isAccepted ? (
                          <span className={styles.sidebarBadgeAccepted}>
                            Accepted
                          </span>
                        ) : (
                          <span className={styles.sidebarBadgeOriginal}>
                            Original
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Right Side-by-Side Comparison Panes */}
              <div className={styles.comparisonMain}>
                {currentDiff && (
                  <>
                    {/* Active Section Header & Change Highlights */}
                    <div className={styles.sectionOverviewCard}>
                      <div className={styles.sectionHeaderRow}>
                        <div className={styles.sectionTitleGroup}>
                          <h2 className={styles.currentSectionTitle}>{currentDiff.title}</h2>
                          {acceptedSections[currentDiff.section] !== false ? (
                            <span className={styles.sidebarBadgeAccepted}>
                              <Check size={12} style={{ display: 'inline', marginRight: 4 }} />
                              AI Version Selected
                            </span>
                          ) : (
                            <span className={styles.sidebarBadgeOriginal}>
                              Original Kept
                            </span>
                          )}
                        </div>

                        <div className={styles.sectionActions}>
                          <Button
                            variant={acceptedSections[currentDiff.section] !== false ? 'primary' : 'outline'}
                            size="sm"
                            icon={CheckCircle2}
                            onClick={() => handleToggleSectionAccept(currentDiff.section, true)}
                          >
                            Accept AI Version
                          </Button>
                          <Button
                            variant={acceptedSections[currentDiff.section] === false ? 'secondary' : 'outline'}
                            size="sm"
                            icon={RotateCcw}
                            onClick={() => handleToggleSectionAccept(currentDiff.section, false)}
                          >
                            Keep Original
                          </Button>
                          {!isEditingCurrent ? (
                            <Button
                              variant="outline"
                              size="sm"
                              icon={Edit3}
                              onClick={() =>
                                handleStartEditing(
                                  customEdits[currentDiff.section] || currentDiff.improved
                                )
                              }
                            >
                              Edit AI Version
                            </Button>
                          ) : (
                            <Button
                              variant="primary"
                              size="sm"
                              icon={Save}
                              onClick={() => handleSaveCustomEdit(currentDiff.section)}
                            >
                              Save Custom Edit
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* AI Improvements Applied */}
                      {currentDiff.change_summary?.length > 0 && (
                        <div className={styles.changeSummaryBox}>
                          <div className={styles.changeSummaryTitle}>AI Modifications Applied</div>
                          <ul className={styles.changeList}>
                            {currentDiff.change_summary.map((change, idx) => (
                              <li key={idx}>{change}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* Dual Panes */}
                    <div className={styles.panesGrid}>
                      {/* Left: Original Version */}
                      <div className={`${styles.pane} ${styles.paneOriginal}`}>
                        <div className={styles.paneHeader}>
                          <div className={styles.paneTitle}>
                            <FileText size={16} />
                            Original Version (Current)
                          </div>
                          <span className={styles.paneTag}>v{resume.current_version || 1}</span>
                        </div>
                        <div className={styles.paneBody}>
                          <SectionContentRenderer
                            sectionKey={currentDiff.section}
                            data={currentDiff.original}
                          />
                        </div>
                      </div>

                      {/* Right: AI Improved Version */}
                      <div className={`${styles.pane} ${styles.paneImproved}`}>
                        <div className={styles.paneHeader}>
                          <div className={`${styles.paneTitle} ${styles.paneTitleImproved}`}>
                            <Sparkles size={16} color="var(--primary-600)" />
                            AI-Enhanced Version
                          </div>
                          <span
                            className={styles.paneTag}
                            style={{
                              background: 'var(--primary-100)',
                              color: 'var(--primary-800)',
                              borderColor: 'var(--primary-200)',
                            }}
                          >
                            {customEdits[currentDiff.section] ? 'Custom Edited' : 'Recommended'}
                          </span>
                        </div>
                        <div className={styles.paneBody}>
                          {isEditingCurrent ? (
                            <div>
                              <p style={{ fontSize: '0.775rem', color: 'var(--slate-500)', marginBottom: '0.5rem' }}>
                                Modify the text or JSON structure below and click 'Save Custom Edit' above:
                              </p>
                              <textarea
                                className={styles.manualEditTextarea}
                                value={editTextVal}
                                onChange={(e) => setEditTextVal(e.target.value)}
                              />
                            </div>
                          ) : (
                            <SectionContentRenderer
                              sectionKey={currentDiff.section}
                              data={customEdits[currentDiff.section] || currentDiff.improved}
                              isImproved
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Save & Apply Modal */}
      {applyModalOpen && (
        <Modal
          isOpen={applyModalOpen}
          onClose={() => setApplyModalOpen(false)}
          title="Apply AI Improvements"
        >
          <div className={styles.applyModalContent}>
            <p style={{ fontSize: '0.875rem', color: 'var(--slate-600)', margin: 0 }}>
              Choose how you want to save your accepted AI enhancements. Your original version will always remain safe in version history.
            </p>

            {/* Option 1: Save as New Version (Recommended) */}
            <div
              className={`${styles.modeOptionCard} ${applyMode === 'new_version' ? styles.modeOptionSelected : ''}`}
              onClick={() => setApplyMode('new_version')}
            >
              <div className={styles.modeHeader}>
                <div className={styles.modeTitle}>
                  <GitBranch size={18} color="var(--primary-600)" />
                  Save as New Version
                </div>
                <span className={styles.modeBadgeRecommended}>Recommended</span>
              </div>
              <p className={styles.modeDesc}>
                Increments resume to v{(resume?.current_version || 1) + 1} with an automatic snapshot. You can revert back to your original version anytime from Version History.
              </p>
            </div>

            {/* Option 2: Save as Separate Resume */}
            <div
              className={`${styles.modeOptionCard} ${applyMode === 'new_resume' ? styles.modeOptionSelected : ''}`}
              onClick={() => setApplyMode('new_resume')}
            >
              <div className={styles.modeHeader}>
                <div className={styles.modeTitle}>
                  <Copy size={18} color="var(--slate-700)" />
                  Create Separate New Resume
                </div>
              </div>
              <p className={styles.modeDesc}>
                Keeps this resume completely untouched and creates a brand-new resume entry in your dashboard.
              </p>
              {applyMode === 'new_resume' && (
                <input
                  type="text"
                  className={styles.newTitleInput}
                  value={newResumeTitle}
                  onChange={(e) => setNewResumeTitle(e.target.value)}
                  placeholder="Enter title for new resume..."
                />
              )}
            </div>

            {/* Option 3: Replace Current Content */}
            <div
              className={`${styles.modeOptionCard} ${applyMode === 'replace' ? styles.modeOptionSelected : ''}`}
              onClick={() => setApplyMode('replace')}
            >
              <div className={styles.modeHeader}>
                <div className={styles.modeTitle}>
                  <Save size={18} color="var(--slate-700)" />
                  Direct Update Existing Resume
                </div>
              </div>
              <p className={styles.modeDesc}>
                Applies improvements directly into the active resume draft. A backup snapshot is automatically recorded first.
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
              <Button variant="ghost" onClick={() => setApplyModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                isLoading={isApplying}
                onClick={handleApplyConfirmed}
                icon={Check}
              >
                Confirm & Apply Improvements
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Full Resume Preview Modal */}
      {fullPreviewModalOpen && (
        <div className={styles.fullPreviewModalOverlay}>
          <div className={styles.fullPreviewModalContent}>
            <div className={styles.fullPreviewHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Eye size={20} color="var(--primary-600)" />
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700 }}>
                  Full Resume Side-by-Side Comparison
                </h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                icon={X}
                onClick={() => setFullPreviewModalOpen(false)}
              >
                Close Preview
              </Button>
            </div>

            <div className={styles.fullPreviewGrid}>
              {/* Left Column: Original */}
              <div className={styles.previewColumn}>
                <div className={styles.previewColTitle}>
                  <FileText size={16} />
                  Original Resume (v{resume?.current_version || 1})
                </div>
                <div className={styles.previewSheet}>
                  {originalPreviewResume && (
                    <TemplateRenderer
                      resume={originalPreviewResume}
                      template={originalPreviewResume.template || 'modern'}
                    />
                  )}
                </div>
              </div>

              {/* Right Column: AI Improved */}
              <div className={styles.previewColumn}>
                <div className={styles.previewColTitle} style={{ color: 'var(--primary-800)' }}>
                  <Sparkles size={16} color="var(--primary-600)" />
                  AI-Enhanced Resume
                </div>
                <div className={styles.previewSheet} style={{ borderColor: 'var(--primary-300)' }}>
                  {improvedPreviewResume && (
                    <TemplateRenderer
                      resume={improvedPreviewResume}
                      template={improvedPreviewResume.template || 'modern'}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Sub-component: Formatted Renderer for Different Section Data Types
function SectionContentRenderer({ sectionKey, data, isImproved = false }) {
  if (!data) {
    return <p style={{ color: 'var(--slate-400)', fontStyle: 'italic' }}>No content provided in this section.</p>;
  }

  // 1. Professional Summary
  if (sectionKey === 'professional_summary') {
    const summaryText = typeof data === 'string' ? data : data.content || '';
    return (
      <div>
        <p style={{ margin: 0, whiteSpace: 'pre-line' }}>{summaryText}</p>
        {data.target_role && (
          <div style={{ marginTop: '0.75rem', fontSize: '0.775rem', color: 'var(--slate-500)' }}>
            <strong>Target Role: </strong> {data.target_role}
          </div>
        )}
      </div>
    );
  }

  // 2. Technical Skills
  if (sectionKey === 'skills') {
    const categories = Array.isArray(data) ? data : [];
    if (categories.length === 0) {
      return <p style={{ color: 'var(--slate-400)', fontStyle: 'italic' }}>No skills listed.</p>;
    }
    return (
      <div className={styles.skillsCloud}>
        {categories.map((cat, idx) => (
          <div key={idx} className={styles.skillCategoryGroup}>
            <span className={styles.skillCategoryName}>{cat.category || 'Skills'}:</span>
            <div className={styles.chipsWrapper}>
              {(cat.items || []).map((item, itemIdx) => (
                <span
                  key={itemIdx}
                  className={`${styles.skillChip} ${isImproved ? styles.skillChipImproved : ''}`}
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // 3. Projects
  if (sectionKey === 'projects') {
    const projects = Array.isArray(data) ? data : [];
    if (projects.length === 0) {
      return <p style={{ color: 'var(--slate-400)', fontStyle: 'italic' }}>No projects listed.</p>;
    }
    return (
      <div>
        {projects.map((proj, idx) => (
          <div key={idx} className={styles.diffItemCard}>
            <div className={styles.diffItemHeader}>
              <span className={styles.diffItemTitle}>{proj.name || 'Untitled Project'}</span>
              <span className={styles.diffItemSubtitle}>
                {proj.start_date || ''} {proj.end_date ? `— ${proj.end_date}` : ''}
              </span>
            </div>
            {proj.description && (
              <p style={{ fontSize: '0.825rem', color: 'var(--slate-600)', margin: '0 0 0.35rem' }}>
                {proj.description}
              </p>
            )}
            {proj.technologies?.length > 0 && (
              <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', marginBottom: '0.4rem' }}>
                {proj.technologies.map((t, tidx) => (
                  <span
                    key={tidx}
                    style={{
                      fontSize: '0.7rem',
                      background: 'var(--slate-200)',
                      padding: '0.1rem 0.4rem',
                      borderRadius: '4px',
                      color: 'var(--slate-700)',
                    }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}
            {proj.key_contributions?.length > 0 && (
              <ul className={styles.bulletList}>
                {proj.key_contributions.map((bullet, bidx) => (
                  <li key={bidx}>{bullet}</li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    );
  }

  // 4. Experience & Internships
  if (sectionKey === 'experience' || sectionKey === 'work_experience' || sectionKey === 'internships') {
    const list = Array.isArray(data) ? data : [];
    if (list.length === 0) {
      return <p style={{ color: 'var(--slate-400)', fontStyle: 'italic' }}>No work experience entries.</p>;
    }
    return (
      <div>
        {list.map((exp, idx) => (
          <div key={idx} className={styles.diffItemCard}>
            <div className={styles.diffItemHeader}>
              <span className={styles.diffItemTitle}>
                {exp.job_title || exp.position || 'Role'} • {exp.company_name || exp.organization || 'Company'}
              </span>
              <span className={styles.diffItemSubtitle}>
                {exp.start_date || ''} {exp.end_date ? `— ${exp.end_date}` : ''}
              </span>
            </div>
            {exp.responsibilities?.length > 0 && (
              <ul className={styles.bulletList}>
                {exp.responsibilities.map((bullet, bidx) => (
                  <li key={bidx}>{bullet}</li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    );
  }

  // 5. Education
  if (sectionKey === 'education') {
    const eduList = Array.isArray(data) ? data : [];
    if (eduList.length === 0) {
      return <p style={{ color: 'var(--slate-400)', fontStyle: 'italic' }}>No education records.</p>;
    }
    return (
      <div>
        {eduList.map((edu, idx) => (
          <div key={idx} className={styles.diffItemCard}>
            <div className={styles.diffItemHeader}>
              <span className={styles.diffItemTitle}>{edu.degree} in {edu.field_of_study}</span>
              <span className={styles.diffItemSubtitle}>{edu.start_year} — {edu.end_year}</span>
            </div>
            <p style={{ margin: 0, fontSize: '0.825rem', color: 'var(--slate-600)' }}>
              {edu.institution} {edu.grade ? `• ${edu.grade_type}: ${edu.grade}` : ''}
            </p>
          </div>
        ))}
      </div>
    );
  }

  // Fallback for objects/arrays
  return (
    <pre style={{ fontSize: '0.75rem', background: 'var(--slate-100)', padding: '0.5rem', borderRadius: '4px', overflowX: 'auto' }}>
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}

