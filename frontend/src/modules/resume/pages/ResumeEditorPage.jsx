import React, { useState } from 'react';
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
import { useNotification } from '../../../context/NotificationContext';
import {
  ArrowLeft,
  Save,
  CheckCircle2,
  Clock,
  Eye,
  Sparkles,
  History,
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
          <input
            className={styles.titleInput}
            value={resume.title || ''}
            onChange={(e) => updateResumeMeta('title', e.target.value)}
            placeholder="Untitled Resume"
            title="Click to rename resume"
          />
        </div>

        <div className={styles.barRight}>
          {/* Template Selector */}
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
            onClick={() => saveResume()}
          >
            Save
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


