import { useState, useEffect, useCallback, useRef } from 'react';
import { resumeService } from '../services/resumeService';
import { useNotification } from '../../../context/NotificationContext';

export function useResumeEditor(resumeId) {
  const [resume, setResume] = useState(null);
  const [content, setContent] = useState(null);
  const [activeSection, setActiveSection] = useState('personal');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const { success, error } = useNotification();
  const autoSaveTimerRef = useRef(null);

  // Load initial resume
  const loadResume = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await resumeService.getResume(resumeId);
      setResume(data);
      setContent(data.content || {});
      setIsDirty(false);
    } catch (err) {
      error(err.message || 'Failed to load resume');
    } finally {
      setIsLoading(false);
    }
  }, [resumeId, error]);

  useEffect(() => {
    if (resumeId) {
      loadResume();
    }
  }, [resumeId, loadResume]);

  // Update specific part of content
  const updateContent = useCallback((updater) => {
    setContent((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : { ...prev, ...updater };
      setIsDirty(true);
      return next;
    });
  }, []);

  // Update resume metadata (e.g. title, template, target_role, status)
  const updateResumeMeta = useCallback((field, value) => {
    setResume((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
  }, []);

  // Save changes to backend
  const saveResume = useCallback(async () => {
    if (!resume || !content) return;
    setIsSaving(true);
    try {
      const updated = await resumeService.updateResume(resume.id, {
        title: resume.title,
        target_role: resume.target_role,
        template: resume.template,
        status: resume.status,
        content,
      });
      setResume(updated);
      setContent(updated.content);
      setIsDirty(false);
      success('Resume saved successfully');
      return updated;
    } catch (err) {
      error(err.message || 'Failed to save resume');
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, [resume, content, success, error]);

  // Debounced auto-save effect (saves 3s after last edit if dirty)
  useEffect(() => {
    if (!isDirty) return;

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = setTimeout(() => {
      saveResume();
    }, 3000);

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [isDirty, saveResume]);

  // Section Ordering: Move Up or Down
  const reorderSection = useCallback((sectionKey, direction) => {
    setContent((prev) => {
      const currentOrder = [...(prev.section_order || [])];
      const index = currentOrder.indexOf(sectionKey);
      if (index === -1) return prev;

      const newIndex = direction === 'up' ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= currentOrder.length) return prev;

      const temp = currentOrder[index];
      currentOrder[index] = currentOrder[newIndex];
      currentOrder[newIndex] = temp;

      setIsDirty(true);
      return {
        ...prev,
        section_order: currentOrder,
      };
    });
  }, []);

  // Section Visibility: Hide or Show
  const toggleSectionVisibility = useCallback((sectionKey) => {
    setContent((prev) => {
      const hidden = new Set(prev.hidden_sections || []);
      if (hidden.has(sectionKey)) {
        hidden.delete(sectionKey);
      } else {
        hidden.add(sectionKey);
      }
      setIsDirty(true);
      return {
        ...prev,
        hidden_sections: Array.from(hidden),
      };
    });
  }, []);

  return {
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
    reload: loadResume,
  };
}

