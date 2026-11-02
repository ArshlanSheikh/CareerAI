import api from '../../../services/api';

export const versionService = {
  // Get all historical version snapshots for a resume
  getVersions: async (resumeId) => {
    const res = await api.get(`/resumes/${resumeId}/versions`);
    return res.data;
  },

  // Create a manual version snapshot
  createVersion: async (resumeId, changeSummary = '') => {
    const res = await api.post(`/resumes/${resumeId}/versions`, {
      change_summary: changeSummary,
    });
    return res.data;
  },

  // Get single version details including full content
  getVersion: async (resumeId, versionId) => {
    const res = await api.get(`/resumes/${resumeId}/versions/${versionId}`);
    return res.data;
  },

  // Restore previous version (creates new sequential version snapshot)
  restoreVersion: async (resumeId, versionId) => {
    const res = await api.post(`/resumes/${resumeId}/versions/${versionId}/restore`);
    return res.data;
  },
};

export default versionService;

