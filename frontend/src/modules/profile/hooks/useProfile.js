import { useState, useEffect, useCallback } from 'react';
import { profileService } from '../services/profileService';
import { useNotification } from '../../../context/NotificationContext';

export function useProfile() {
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { success, error } = useNotification();

  const fetchProfile = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await profileService.getProfile();
      setProfile(data);
    } catch (err) {
      error(err.message || 'Failed to load student profile');
    } finally {
      setIsLoading(false);
    }
  }, [error]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const saveProfile = async (updatedData = null) => {
    const dataToSend = updatedData || profile;
    if (!dataToSend) return;

    setIsSaving(true);
    try {
      const updated = await profileService.updateProfile(dataToSend);
      setProfile(updated);
      success('Student profile saved successfully!');
      return updated;
    } catch (err) {
      error(err.message || 'Failed to save student profile');
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  // Calculate completion percentage
  const calculateCompletion = () => {
    if (!profile) return 0;
    let score = 0;
    let total = 5;

    // 1. Personal info
    if (profile.personal_info?.full_name && profile.personal_info?.email && profile.personal_info?.phone) {
      score += 1;
    }
    // 2. Education
    if (profile.education && profile.education.length > 0) {
      score += 1;
    }
    // 3. Skills
    if (profile.skills && profile.skills.some((c) => c.items && c.items.length > 0)) {
      score += 1;
    }
    // 4. Projects
    if (profile.projects && profile.projects.length > 0) {
      score += 1;
    }
    // 5. Experience
    if (profile.work_experience && profile.work_experience.length > 0) {
      score += 1;
    }

    return Math.round((score / total) * 100);
  };

  return {
    profile,
    setProfile,
    isLoading,
    isSaving,
    saveProfile,
    fetchProfile,
    completionPercentage: calculateCompletion(),
  };
}

