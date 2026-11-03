import api from '../../../services/api';

export const resumeService = {
  async getResumes() {
    const response = await api.get('/resumes');
    return response.data;
  },

  async getResume(id) {
    const response = await api.get(`/resumes/${id}`);
    return response.data;
  },

  async createResume(data) {
    const response = await api.post('/resumes', data);
    return response.data;
  },

  async updateResume(id, data) {
    const response = await api.put(`/resumes/${id}`, data);
    return response.data;
  },

  async duplicateResume(id) {
    const response = await api.post(`/resumes/${id}/duplicate`);
    return response.data;
  },

  async deleteResume(id) {
    const response = await api.delete(`/resumes/${id}`);
    return response.data;
  },

  async importResume(formData) {
    const response = await api.post('/resumes/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async extractResumePreview(formData) {
    const response = await api.post('/resumes/extract-preview', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async importFromConfirmed(title, confirmedContent) {
    const response = await api.post('/resumes/import', {
      title,
      confirmed_content: confirmedContent,
    });
    return response.data;
  },

  async downloadPdf(id, filename = 'Resume.pdf') {
    const blob = await api.get(`/resumes/${id}/pdf`, {
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);
    window.URL.revokeObjectURL(url);
  },
};

