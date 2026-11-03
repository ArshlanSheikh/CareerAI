import api from '../../../services/api';

export const enhancementService = {
  /**
   * Request full AI resume enhancement
   * @param {string} resumeId 
   * @param {Object} options { target_role, custom_instructions, analysis_id }
   * @returns {Promise<Object>}
   */
  async generateEnhancement(resumeId, options = {}) {
    return await api.post(
      `/enhancement/resume/${resumeId}/generate`,
      options,
      { timeout: 75000 } // Extended timeout for comprehensive AI rewrite
    );
  },

  /**
   * Get latest enhancement record for a resume
   * @param {string} resumeId 
   * @returns {Promise<Object>}
   */
  async getLatestEnhancement(resumeId) {
    return await api.get(`/enhancement/resume/${resumeId}/latest`);
  },

  /**
   * Get specific enhancement by ID
   * @param {string} enhancementId 
   * @returns {Promise<Object>}
   */
  async getEnhancement(enhancementId) {
    return await api.get(`/enhancement/${enhancementId}`);
  },

  /**
   * Apply enhancement sections with chosen versioning mode
   * @param {string} resumeId 
   * @param {Object} payload { mode, accepted_sections, custom_content, title_for_new_resume }
   * @returns {Promise<Object>}
   */
  async applyEnhancement(resumeId, payload = {}) {
    return await api.post(`/enhancement/resume/${resumeId}/apply`, payload);
  },
};

export default enhancementService;

