import api from '../../../services/api';

export const authService = {
  async register({ email, password, full_name }) {
    const response = await api.post('/auth/register', {
      email,
      password,
      full_name,
    });
    return response.data;
  },

  async login({ email, password }) {
    const response = await api.post('/auth/login', {
      email,
      password,
    });
    return response.data;
  },

  async getMe() {
    const response = await api.get('/auth/me');
    return response.data;
  },

  async logout() {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignored on logout
    }
  },
};

