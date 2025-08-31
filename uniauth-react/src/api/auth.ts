import { apiClient } from './client';

export const authApi = {
  async login(username: string, password: string): Promise<{ token: string }> {
    const { data } = await apiClient.post('/admin/auth/login', { username, password });
    return data;
  },
  async me(): Promise<{ username: string; role: string }> {
    const { data } = await apiClient.get('/admin/auth/me');
    return data;
  },
};

export default authApi;
