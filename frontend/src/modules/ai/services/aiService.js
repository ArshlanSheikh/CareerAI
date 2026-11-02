import api from '../../../services/api';

export const aiService = {
  // Generate or enhance professional summary
  generateSummary: async (data) => {
    const res = await api.post('/ai/generate-summary', data);
    return res.data;
  },

  // Improve project description & key contributions
  improveProject: async (data) => {
    const res = await api.post('/ai/improve-project', data);
    return res.data;
  },

  // Improve work experience responsibilities & achievements
  improveExperience: async (data) => {
    const res = await api.post('/ai/improve-experience', data);
    return res.data;
  },

  // Improve internship description & key contributions
  improveInternship: async (data) => {
    const res = await api.post('/ai/improve-internship', data);
    return res.data;
  },

  // Suggest technical skills based on target role & context
  suggestSkills: async (data) => {
    const res = await api.post('/ai/suggest-skills', data);
    return res.data;
  },

  // Get active/pending suggestions for a resume
  getSuggestions: async (resumeId) => {
    const res = await api.get(`/ai/suggestions/${resumeId}`);
    return res.data;
  },

  // Accept a suggestion (with optional manual user edits)
  acceptSuggestion: async (suggestionId, editedContent = null) => {
    const payload = editedContent ? { edited_content: editedContent } : {};
    const res = await api.post(`/ai/suggestions/${suggestionId}/accept`, payload);
    return res.data;
  },

  // Reject a suggestion
  rejectSuggestion: async (suggestionId) => {
    const res = await api.post(`/ai/suggestions/${suggestionId}/reject`);
    return res.data;
  },
};

export default aiService;

