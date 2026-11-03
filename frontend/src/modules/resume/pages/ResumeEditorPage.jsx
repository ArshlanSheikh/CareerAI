import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import styles from './ResumeEditorPage.module.css';
import { useResumeEditor } from '../hooks/useResumeEditor';
import SectionNav from '../components/Editor/SectionNav';
import PersonalInfoEditor from '../components/Editor/PersonalInfoEditor';
import SummaryEditor from '../components/Editor/SummaryEditor';
import EducationEditor from '../components/Editor/EducationEditor';
import SkillsEditor from '../components/Editor/SkillsEditor';
import ProjectsEditor from '../components/Editor/ProjectsEditor';
import ExperienceEditor from '../components/Editor/ExperienceEditor';
import InternshipsEditor from '../components/Editor/InternshipsEditor';
import CertificationsEditor from '../components/Editor/CertificationsEditor';
import AdditionalInfoEditor from '../components/Editor/AdditionalInfoEditor';
import QuickPreview from '../components/Editor/QuickPreview';
import Button from '../../../components/common/Button/Button';
import Loader from '../../../components/common/Loader/Loader';
import AiSuggestionModal from '../../ai/components/AiSuggestionModal/AiSuggestionModal';
import VersionHistoryDrawer from '../components/VersionHistoryDrawer/VersionHistoryDrawer';
import aiService from '../../ai/services/aiService';
import analysisService from '../../analysis/services/analysisService';
import { useNotification } from '../../../context/NotificationContext';
import {
  ArrowLeft,
  Save,
  CheckCircle2,
  Clock,
  Eye,
  Sparkles,
  History,
  ChevronDown,
  Edit3,
  Activity,
  AlertTriangle,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Zap,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';

export default function ResumeEditorPage() {
  const { id } = useParams();
  const notify = useNotification();
  const {
    resume,
    content,
    activeSection,
    setActiveSection,
    isLoading,
    isSaving,
    isDirty,
    updateContent,
    updateResumeMeta,
    saveResume,
    reorderSection,
    toggleSectionVisibility,
  } = useResumeEditor(id);

  // AI Modal State
  const [aiModal, setAiModal] = useState({
    isOpen: false,
    title: '',
    sectionName: '',
    originalContent: null,
    suggestion: null,
    isLoading: false,
    requestPayload: null,
    generatorFn: null,
  });

  // Version History State
  const [historyOpen, setHistoryOpen] = useState(false);

  // Latest Analysis & Continuous Guidance State
  const [latestAnalysis, setLatestAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const loadLatestAnalysis = async () => {
    if (!id) return;
    try {
      const res = await analysisService.getLatestAnalysis(id);
      if (res && res.data) {
        setLatestAnalysis(res.data);
      }
    } catch {
      // No analysis run yet is normal for newly created drafts
      setLatestAnalysis(null);
    }
  };

  useEffect(() => {
    if (resume?.id) {
      loadLatestAnalysis();
    }
  }, [resume?.id]);

  const handleSaveWithSync = async () => {
    try {
      const saved = await saveResume();
      if (saved) {
        loadLatestAnalysis();
      }
    } catch {
      // Error notifications handled by hook
    }
  };

  const handleRunAnalysis = async () => {
    if (isDirty) {
      try {
        await saveResume();
      } catch (err) {
        notify.error('Please save your changes before running analysis');
        return;
      }
    }
    setIsAnalyzing(true);
    try {
      const res = await analysisService.analyzeResume(resume.id, resume.target_role || '');
      if (res && res.data) {
        setLatestAnalysis(res.data);
        if (res.data.ats_compatibility_score != null) {
          updateResumeMeta('ats_score', res.data.ats_compatibility_score);
        }
        if (res.data.overall_score != null) {
          updateResumeMeta('overall_score', res.data.overall_score);
        }
      }
      notify.success('AI Resume Analysis completed successfully!');
    } catch (err) {
      notify.error(err.message || 'Analysis failed. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFixSection = (sectionKey) => {
    const key = (sectionKey || '').toLowerCase();
    if (key.includes('summary')) {
      setActiveSection('summary');
      handleAiSummary();
    } else if (key.includes('skill')) {
      setActiveSection('skills');
      handleAiSkills();
    } else if (key.includes('project')) {
      setActiveSection('projects');
      if (content?.projects && content.projects.length > 0) {
        handleAiProject(0, content.projects[0]);
      }
    } else if (key.includes('experience') || key.includes('work')) {
      setActiveSection('experience');
      if (content?.work_experience && content.work_experience.length > 0) {
        handleAiExperience(0, content.work_experience[0]);
      }
    } else if (key.includes('intern')) {
      setActiveSection('internships');
      if (content?.internships && content.internships.length > 0) {
        handleAiInternship(0, content.internships[0]);
      }
    } else if (key.includes('cert')) {
      setActiveSection('certifications');
    } else if (key.includes('edu')) {
      setActiveSection('education');
    } else {
      setActiveSection(key || 'summary');
    }
  };

  const handleAiSummary = async () => {
    const payload = {
      resume_id: resume.id,
      original_content: content.professional_summary?.content || '',
      target_role: resume.target_role || content.professional_summary?.target_role || '',
      experience_level: content.professional_summary?.experience_level || 'Entry Level / Student',
    };
    setAiModal({
      isOpen: true,
      title: 'AI Summary Improvement',
      sectionName: 'Summary',
      originalContent: payload.original_content,
      suggestion: null,
      isLoading: true,
      requestPayload: payload,
      generatorFn: (p) => aiService.generateSummary(p),
    });
    try {
      const res = await aiService.generateSummary(payload);
      setAiModal((prev) => ({ ...prev, isLoading: false, suggestion: res }));
    } catch (err) {
      notify.error(err.message || 'Failed to generate AI summary');
      setAiModal((prev) => ({ ...prev, isOpen: false, isLoading: false }));
    }
  };

  const handleAiProject = async (projIndex, proj) => {
    const payload = {
      resume_id: resume.id,
      project_id: proj.id,
      project_name: proj.name || '',
      technologies: proj.technologies || [],
      original_description: proj.description || '',
      key_contributions: proj.key_contributions || [],
      personally_implemented_features: proj.personally_implemented_features || [],
    };
    setAiModal({
      isOpen: true,
      title: `AI Enhance Project: ${proj.name || 'Project'}`,
      sectionName: 'Projects',
      originalContent: {
        description: proj.description,
        personally_implemented_features: proj.personally_implemented_features,
      },
      suggestion: null,
      isLoading: true,
      requestPayload: payload,
      generatorFn: (p) => aiService.improveProject(p),
    });
    try {
      const res = await aiService.improveProject(payload);
      setAiModal((prev) => ({ ...prev, isLoading: false, suggestion: res }));
    } catch (err) {
      notify.error(err.message || 'Failed to improve project');
      setAiModal((prev) => ({ ...prev, isOpen: false, isLoading: false }));
    }
  };

  const handleAiExperience = async (expIndex, exp) => {
    const payload = {
      resume_id: resume.id,
      experience_id: exp.id,
      company_name: exp.company_name || '',
      job_title: exp.job_title || '',
      responsibilities: exp.responsibilities || [],
      achievements: exp.achievements || [],
      technologies: exp.technologies || [],
    };
    setAiModal({
      isOpen: true,
      title: `AI Enhance Experience: ${exp.job_title || 'Work Experience'}`,
      sectionName: 'Work Experience',
      originalContent: exp.responsibilities,
      suggestion: null,
      isLoading: true,
      requestPayload: payload,
      generatorFn: (p) => aiService.improveExperience(p),
    });
    try {
      const res = await aiService.improveExperience(payload);
      setAiModal((prev) => ({ ...prev, isLoading: false, suggestion: res }));
    } catch (err) {
      notify.error(err.message || 'Failed to improve experience');
      setAiModal((prev) => ({ ...prev, isOpen: false, isLoading: false }));
    }
  };

  const handleAiInternship = async (intIndex, item) => {
    const payload = {
      resume_id: resume.id,
      internship_id: item.id,
      organization: item.organization || '',
      position: item.position || '',
      responsibilities: item.responsibilities || [],
      skills_learned: item.skills_learned || [],
    };
    setAiModal({
      isOpen: true,
      title: `AI Enhance Internship: ${item.position || 'Internship'}`,
      sectionName: 'Internships',
      originalContent: item.responsibilities,
      suggestion: null,
      isLoading: true,
      requestPayload: payload,
      generatorFn: (p) => aiService.improveInternship(p),
    });
    try {
      const res = await aiService.improveInternship(payload);
      setAiModal((prev) => ({ ...prev, isLoading: false, suggestion: res }));
    } catch (err) {
      notify.error(err.message || 'Failed to improve internship');
      setAiModal((prev) => ({ ...prev, isOpen: false, isLoading: false }));
    }
  };

  const handleAiSkills = async () => {
    const payload = {
      resume_id: resume.id,
      target_role: resume.target_role || '',
    };
    setAiModal({
      isOpen: true,
      title: 'AI Suggest Skills for Target Role',
      sectionName: 'Skills',
      originalContent: (content.skills || []).map((c) => `${c.category}: ${(c.items || []).join(', ')}`),
      suggestion: null,
      isLoading: true,
      requestPayload: payload,
      generatorFn: (p) => aiService.suggestSkills(p),
    });
    try {
      const res = await aiService.suggestSkills(payload);
      setAiModal((prev) => ({ ...prev, isLoading: false, suggestion: res }));
    } catch (err) {
      notify.error(err.message || 'Failed to suggest skills');
      setAiModal((prev) => ({ ...prev, isOpen: false, isLoading: false }));
    }
  };

  const handleAcceptSuggestion = async (suggestionId, editedContent) => {
    try {
      const res = await aiService.acceptSuggestion(suggestionId, editedContent);
      if (res?.updated_resume?.content) {
        updateContent(res.updated_resume.content);
      }
      notify.success('AI suggestion applied to your resume!');
    } catch (err) {
      notify.error(err.message || 'Failed to accept suggestion');
    }
  };

  const handleRejectSuggestion = async (suggestionId) => {
    try {
      await aiService.rejectSuggestion(suggestionId);
      notify.info('AI suggestion dismissed.');
    } catch (err) {
      notify.error(err.message || 'Failed to reject suggestion');
    }
  };

  const handleRegenerateSuggestion = async (customInstructions) => {
    if (!aiModal.generatorFn || !aiModal.requestPayload) return;
    setAiModal((prev) => ({ ...prev, isLoading: true }));
    try {
      const newPayload = {
        ...aiModal.requestPayload,
        custom_instructions: customInstructions,
      };
      const res = await aiModal.generatorFn(newPayload);
      setAiModal((prev) => ({ ...prev, isLoading: false, suggestion: res }));
    } catch (err) {
      notify.error(err.message || 'Failed to generate revision');
      setAiModal((prev) => ({ ...prev, isLoading: false }));
    }
  };

  if (isLoading) {
    return <Loader fullPage message="Opening resume editor workspace..." />;
  }

  if (!resume || !content) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <h2>Resume Not Found</h2>
        <p style={{ color: 'var(--slate-500)', margin: '1rem 0' }}>
          The requested resume could not be loaded or access was denied.
        </p>
        <Link to="/dashboard">
          <Button variant="primary" size="md">Back to Dashboard</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.editorPage}>
      {/* Top Action Bar */}
      <div className={styles.topBar}>
        <div className={styles.barLeft}>
          <Link to="/dashboard" className={styles.backBtn} title="Return to Dashboard">
            <ArrowLeft size={18} />
          </Link>
          <div className={styles.titleWrapper}>
            <input
              className={styles.titleInput}
              value={resume.title || ''}
              onChange={(e) => updateResumeMeta('title', e.target.value)}
              placeholder="Untitled Resume"
              title="Click to rename resume"
            />
            <Edit3 size={14} style={{ color: 'var(--slate-400)', flexShrink: 0 }} />
          </div>
        </div>

        <div className={styles.barRight}>
          {/* Template Selector */}
          <div className={styles.templateSelectWrapper}>
            <select
              className={styles.templateSelect}
              value={resume.template || 'modern'}
              onChange={(e) => updateResumeMeta('template', e.target.value)}
              title="Switch resume template"
            >
              <option value="modern">Modern Professional</option>
              <option value="ats">Minimal ATS-Friendly</option>
              <option value="traditional">Traditional Professional</option>
            </select>
            <ChevronDown size={14} className={styles.selectArrow} />
          </div>

          {/* Dirty / Saved Status */}
          <div className={`${styles.statusIndicator} ${isDirty ? styles.dirty : styles.saved}`}>
            {isDirty ? (
              <>
                <Clock size={12} />
                <span>Unsaved edits</span>
              </>
            ) : (
              <>
                <CheckCircle2 size={12} />
                <span>Saved</span>
              </>
            )}
          </div>

          {/* Manual Save Button */}
          <Button
            variant="primary"
            size="sm"
            icon={Save}
            isLoading={isSaving}
            onClick={handleSaveWithSync}
          >
            Save
          </Button>

          {/* Re-Analyze Button */}
          <Button
            variant="secondary"
            size="sm"
            icon={RefreshCw}
            isLoading={isAnalyzing}
            onClick={handleRunAnalysis}
            title="Save edits and re-run AI ATS analysis"
          >
            Re-Analyze
          </Button>

          {/* Version History Button */}
          <Button
            variant="outline"
            size="sm"
            icon={History}
            onClick={() => setHistoryOpen(true)}
            title="View revision snapshots and restore points"
          >
            v{resume.current_version || 1} History
          </Button>

          {/* AI Analysis Dashboard Button */}
          <Link to={`/resumes/${resume.id}/analysis`}>
            <Button
              variant="outline"
              size="sm"
              icon={Sparkles}
              title="Open AI ATS & Content Analysis Dashboard"
              style={{
                borderColor: 'var(--primary-300)',
                color: 'var(--primary-700)',
                background: 'var(--primary-50)',
              }}
            >
              {latestAnalysis?.overall_score != null
                ? `Score: ${latestAnalysis.overall_score}%`
                : resume.overall_score != null
                ? `Score: ${resume.overall_score}%`
                : 'Analytics'}
            </Button>
          </Link>

          {/* Full Preview & Download */}
          <Link to={`/resumes/${resume.id}/preview`}>
            <Button variant="outline" size="sm" icon={Eye}>
              Full Preview
            </Button>
          </Link>
        </div>
      </div>

      {/* 3-Panel Workspace */}
      <div className={styles.workspaceGrid}>
        {/* Left Panel: Section Navigation, Ordering, & Visibility */}
        <SectionNav
          activeSection={activeSection}
          onSelectSection={setActiveSection}
          content={content}
          onReorder={reorderSection}
          onToggleVisibility={toggleSectionVisibility}
        />

        {/* Center Panel: Active Section Editor */}
        <main className={styles.centerPanel}>
          {activeSection === 'personal' && (
            <PersonalInfoEditor
              data={content.personal_info || {}}
              onChange={(pInfo) => updateContent({ personal_info: pInfo })}
            />
          )}

          {activeSection === 'summary' && (
            <SummaryEditor
              data={content.professional_summary || {}}
              onChange={(summary) => updateContent({ professional_summary: summary })}
              onTriggerAi={handleAiSummary}
            />
          )}

          {activeSection === 'education' && (
            <EducationEditor
              list={content.education || []}
              onChange={(edu) => updateContent({ education: edu })}
            />
          )}

          {activeSection === 'skills' && (
            <SkillsEditor
              list={content.skills || []}
              onChange={(skills) => updateContent({ skills })}
              onTriggerAi={handleAiSkills}
            />
          )}

          {activeSection === 'projects' && (
            <ProjectsEditor
              list={content.projects || []}
              onChange={(proj) => updateContent({ projects: proj })}
              onTriggerAi={handleAiProject}
            />
          )}

          {activeSection === 'experience' && (
            <ExperienceEditor
              list={content.work_experience || []}
              onChange={(exp) => updateContent({ work_experience: exp })}
              onTriggerAi={handleAiExperience}
            />
          )}

          {activeSection === 'internships' && (
            <InternshipsEditor
              list={content.internships || []}
              onChange={(intn) => updateContent({ internships: intn })}
              onTriggerAi={handleAiInternship}
            />
          )}

          {activeSection === 'certifications' && (
            <CertificationsEditor
              list={content.certifications || []}
              onChange={(certs) => updateContent({ certifications: certs })}
            />
          )}

          {activeSection === 'additional' && (
            <AdditionalInfoEditor
              data={content.additional_info || {}}
              onChange={(add) => updateContent({ additional_info: add })}
            />
          )}
        </main>

        {/* Right Panel: Live Synchronized Preview */}
        <aside className={styles.rightPanel}>
          <QuickPreview
            content={content}
            template={resume.template || 'modern'}
            targetRole={resume.target_role}
          />
        </aside>
      </div>

      {/* Embedded Resume Analytics & Continuous AI Assistant */}
      <section className={styles.analyticsSection}>
        <div className={styles.analyticsHeader}>
          <div className={styles.analyticsTitleWrap}>
            <div className={styles.analyticsIconBadge}>
              <Activity size={20} />
            </div>
            <div>
              <div className={styles.analyticsTitleRow}>
                <h3 className={styles.analyticsTitle}>Resume Health & Continuous AI Guidance</h3>
                <span className={styles.analyticsSyncBadge}>
                  {latestAnalysis ? 'Live Benchmarked' : 'Ready for Scan'}
                </span>
              </div>
              <p className={styles.analyticsSubtitle}>
                Instant evaluation against ATS parsers, recruiter standards, and role-specific keywords.
              </p>
            </div>
          </div>

          <div className={styles.analyticsActions}>
            <Button
              variant="secondary"
              size="sm"
              icon={isAnalyzing ? RefreshCw : Sparkles}
              isLoading={isAnalyzing}
              onClick={handleRunAnalysis}
            >
              {latestAnalysis ? 'Re-Analyze Resume' : 'Run First AI Scan'}
            </Button>
            <Link to={`/resumes/${resume.id}/analysis`}>
              <Button variant="outline" size="sm" icon={ExternalLink}>
                Full Semrush-Style Dashboard
              </Button>
            </Link>
          </div>
        </div>

        {latestAnalysis ? (
          <div className={styles.analyticsBody}>
            {/* 4 Score KPI strip */}
            <div className={styles.kpiStrip}>
              <div className={styles.kpiCard}>
                <div className={styles.kpiTop}>
                  <span className={styles.kpiLabel}>Overall Score</span>
                  <TrendingUp size={14} className={styles.kpiIcon} />
                </div>
                <div className={styles.kpiValueRow}>
                  <span className={styles.kpiValue}>
                    {latestAnalysis.overall_score ?? '--'}
                    <span className={styles.kpiUnit}>%</span>
                  </span>
                  <span
                    className={`${styles.scorePill} ${
                      latestAnalysis.overall_score >= 80
                        ? styles.pillGood
                        : latestAnalysis.overall_score >= 60
                        ? styles.pillAvg
                        : styles.pillLow
                    }`}
                  >
                    {latestAnalysis.overall_score >= 80
                      ? 'Strong'
                      : latestAnalysis.overall_score >= 60
                      ? 'Moderate'
                      : 'Needs Work'}
                  </span>
                </div>
              </div>

              <div className={styles.kpiCard}>
                <div className={styles.kpiTop}>
                  <span className={styles.kpiLabel}>ATS Compatibility</span>
                  <ShieldCheck size={14} className={styles.kpiIcon} />
                </div>
                <div className={styles.kpiValueRow}>
                  <span className={styles.kpiValue}>
                    {latestAnalysis.ats_compatibility_score ?? '--'}
                    <span className={styles.kpiUnit}>%</span>
                  </span>
                  <span className={styles.estTag}>Est.</span>
                </div>
              </div>

              <div className={styles.kpiCard}>
                <div className={styles.kpiTop}>
                  <span className={styles.kpiLabel}>Job Readiness</span>
                  <Zap size={14} className={styles.kpiIcon} />
                </div>
                <div className={styles.kpiValueRow}>
                  <span className={styles.kpiValue}>
                    {latestAnalysis.job_readiness_score ?? '--'}
                    <span className={styles.kpiUnit}>%</span>
                  </span>
                  <span className={styles.estTag}>Est.</span>
                </div>
              </div>

              <div className={styles.kpiCard}>
                <div className={styles.kpiTop}>
                  <span className={styles.kpiLabel}>Content Quality</span>
                  <CheckCircle2 size={14} className={styles.kpiIcon} />
                </div>
                <div className={styles.kpiValueRow}>
                  <span className={styles.kpiValue}>
                    {latestAnalysis.content_quality_score ?? '--'}
                    <span className={styles.kpiUnit}>%</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Weaknesses & 1-Click Fixes */}
            <div className={styles.recommendationsArea}>
              <div className={styles.recHeaderRow}>
                <h4 className={styles.recHeader}>
                  <AlertCircle size={16} />
                  Detected Optimization Opportunities ({latestAnalysis.weaknesses?.length || 0})
                </h4>
                <span className={styles.recSubtext}>Click any fix to open immediate AI assistance</span>
              </div>

              {latestAnalysis.weaknesses && latestAnalysis.weaknesses.length > 0 ? (
                <div className={styles.weaknessGrid}>
                  {latestAnalysis.weaknesses.slice(0, 4).map((w, idx) => {
                    const title = typeof w === 'object' ? (w?.title || 'Potential Improvement') : 'Improvement';
                    const desc = typeof w === 'object' ? (w?.recommendation || w?.description || '') : String(w);
                    const severity = typeof w === 'object' ? (w?.severity || 'suggestion') : 'suggestion';
                    const section = typeof w === 'object' ? (w?.section || 'General') : 'General';
                    return (
                      <div key={idx} className={styles.weaknessCard}>
                        <div className={styles.weaknessTop}>
                          <span
                            className={`${styles.severityBadge} ${
                              severity === 'critical'
                                ? styles.badgeCritical
                                : severity === 'warning'
                                ? styles.badgeWarning
                                : styles.badgeSuggestion
                            }`}
                          >
                            {severity}
                          </span>
                          <span className={styles.weaknessSection}>{section}</span>
                        </div>
                        <div className={styles.weaknessTitle}>{title}</div>
                        <p className={styles.weaknessDesc}>{desc}</p>
                        <button
                          type="button"
                          className={styles.oneClickFixBtn}
                          onClick={() => handleFixSection(section)}
                        >
                          <Zap size={13} />
                          <span>1-Click AI Fix</span>
                          <ArrowRight size={12} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className={styles.emptyWeaknessState}>
                  <CheckCircle2 size={24} style={{ color: 'var(--success-600)' }} />
                  <div>
                    <strong>Outstanding Profile Alignment!</strong>
                    <p>No critical weak spots detected in your current resume content.</p>
                  </div>
                </div>
              )}
            </div>

            <div className={styles.disclaimerNote}>
              * ATS compatibility and Job Readiness scores are algorithmic estimates designed to guide resume enhancement. They are not guarantees of recruiter selection or employment outcomes.
            </div>
          </div>
        ) : (
          <div className={styles.initialScanBanner}>
            <div className={styles.scanBannerText}>
              <h4>No AI Health Scan Recorded Yet</h4>
              <p>
                Run your first analysis to evaluate keyword coverage, ATS parseability, readability, and receive contextual 1-click improvements.
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              icon={Sparkles}
              isLoading={isAnalyzing}
              onClick={handleRunAnalysis}
            >
              Analyze Resume Now
            </Button>
          </div>
        )}
      </section>

      {/* AI Suggestion Modal */}
      <AiSuggestionModal
        isOpen={aiModal.isOpen}
        onClose={() => setAiModal((prev) => ({ ...prev, isOpen: false }))}
        title={aiModal.title}
        sectionName={aiModal.sectionName}
        originalContent={aiModal.originalContent}
        suggestion={aiModal.suggestion}
        isLoading={aiModal.isLoading}
        onAccept={handleAcceptSuggestion}
        onReject={handleRejectSuggestion}
        onRegenerate={handleRegenerateSuggestion}
      />

      {/* Version History Drawer */}
      <VersionHistoryDrawer
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
        resumeId={resume.id}
        currentVersionNumber={resume.current_version || 1}
        onRestore={(restoredResume) => {
          if (restoredResume.content) {
            updateContent(restoredResume.content);
          }
          if (restoredResume.current_version) {
            updateResumeMeta('current_version', restoredResume.current_version);
          }
          if (restoredResume.template) {
            updateResumeMeta('template', restoredResume.template);
          }
        }}
      />
    </div>
  );
}


