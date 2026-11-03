import api from '../../../services/api';

export const analysisService = {
  /**
   * Run full AI Resume Analysis
   * @param {string} resumeId 
   * @param {string} targetRole 
   * @returns {Promise<Object>}
   */
  async analyzeResume(resumeId, targetRole = '') {
    return await api.post(
      `/analysis/resume/${resumeId}`,
      { target_role: targetRole },
      { timeout: 75000 } // Extended timeout for comprehensive AI analysis
    );
  },

  /**
   * Retrieve the latest cached analysis for a resume
   * @param {string} resumeId 
   * @returns {Promise<Object>}
   */
  async getLatestAnalysis(resumeId) {
    return await api.get(`/analysis/resume/${resumeId}/latest`);
  },

  /**
   * Get specific analysis record by ID
   * @param {string} analysisId 
   * @returns {Promise<Object>}
   */
  async getAnalysis(analysisId) {
    return await api.get(`/analysis/${analysisId}`);
  },

  /**
   * Get all past analyses for a resume (history)
   * @param {string} resumeId 
   * @returns {Promise<Array>}
   */
  async getAnalysisHistory(resumeId) {
    return await api.get(`/analysis/resume/${resumeId}/history`);
  },
};

export default analysisService;

