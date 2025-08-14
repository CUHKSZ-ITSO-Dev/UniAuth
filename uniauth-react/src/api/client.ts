import axios from 'axios';
import { toast } from 'react-hot-toast';
import type {
  UserPermissionView,
  User,
  PermissionCheckRequest,
  BatchOperationRequest,
  AuditReport,
} from '../types';

// API 基础配置
// 优先从环境变量 VITE_API_URL 读取，如果没有，则默认为 /api/v1
// 这样生产环境构建出的代码会使用相对路径，而本地开发时可以通过 .env 文件指定一个完整的 URL
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
apiClient.interceptors.request.use(
  (config) => {
    // 从 localStorage 获取 token
    const token = localStorage.getItem('uniauth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // 未授权，跳转到登录页
      window.location.href = '/login';
    } else if (error.response?.status >= 500) {
      toast.error('服务器错误，请稍后重试');
    }
    return Promise.reject(error);
  }
);

// API 方法
export const api = {
  // 用户相关
  async getUserPermissionTree(upn: string): Promise<UserPermissionView> {
    const { data } = await apiClient.get(`/admin/user/${upn}/permissions`);
    return data;
  },

  async getUserCostRecords(upn: string, params?: {
    page?: number;
    pageSize?: number;
  }): Promise<{
    upn: string;
    costRecords: Array<{
      ID: number;
      cost: string;
      model: string;
      source: string;
      tokens: number;
      kind: string;
      upn: string;
      CreatedAt: string;
      UpdatedAt: string;
    }>;
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  }> {
    const { data } = await apiClient.get(`/admin/user/${upn}/cost-records`, {
      params,
    });
    return data;
  },

  async searchUsers(query: string): Promise<User[]> {
    const { data } = await apiClient.get('/admin/users', {
      params: { q: query },
    });
    return data;
  },

  async getAllUsers(): Promise<User[]> {
    const { data } = await apiClient.get('/admin/users');
    return data;
  },

  // 权限检查
  async checkPermission(request: PermissionCheckRequest): Promise<{ allowed: boolean }> {
    const { data } = await apiClient.post('/auth/check', request);
    return data;
  },

  // 批量操作
  async batchOperation(request: BatchOperationRequest): Promise<{
    totalCount: number;
    successCount: number;
    results: Array<{ upn: string; success: boolean; message: string }>;
  }> {
    const { data } = await apiClient.post('/admin/batch/permissions', request);
    return data;
  },

  // 权限管理
  async togglePermission(upn: string, resource: string, resourceId: string, action: string, enable: boolean) {
    const { data } = await apiClient.post('/admin/permission/toggle', {
      upn,
      resource,
      resourceId,
      action,
      enable,
    });
    return data;
  },

  async explainPermission(upn: string, domain: string, object: string, action: string): Promise<{
    allowed: boolean;
    reason: string;
    matchedRules: string[];
    explain: any[];
  }> {
    const { data } = await apiClient.post('/admin/explain-permission', {
      upn,
      domain,
      object,
      action,
    });
    return data;
  },

  // 审计
  async generateAuditReport(): Promise<AuditReport> {
    const { data } = await apiClient.post('/admin/audit/generate');
    return data;
  },

  async getAuditHistory(params?: {
    days?: number;
    page?: number;
    pageSize?: number;
    user?: string;
    action?: string;
  }): Promise<{
    logs: Array<{
      id: number;
      timestamp: string;
      user: string;
      action: string;
      resource: string;
      details: string;
      success: boolean;
      ipAddress: string;
      userAgent: string;
      createdAt: string;
    }>;
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }> {
    const { data } = await apiClient.get('/admin/audit/logs', {
      params,
    });
    return data;
  },

  async getAuditStats(days: number = 7): Promise<{
    dailyStats: Array<{ date: string; count: number }>;
    actionStats: Array<{ action: string; count: number }>;
    userStats: Array<{ user: string; count: number }>;
  }> {
    const { data } = await apiClient.get('/admin/audit/stats', {
      params: { days },
    });
    return data;
  },

  // 组管理
  async getUserGroups(upn: string): Promise<{
    groups: string[];
    primaryGroup: string;
    internalPermissions: string[];
  }> {
    const { data } = await apiClient.get(`/auth/user/${upn}/groups`);
    return data;
  },

  async addUserToGroup(upn: string, group: string) {
    const { data } = await apiClient.post('/admin/group/add-user', {
      upn,
      group,
    });
    return data;
  },

  async removeUserFromGroup(upn: string, group: string) {
    const { data } = await apiClient.post('/admin/group/remove-user', {
      upn,
      group,
    });
    return data;
  },

  async updateChatCategory(id: number, data: { defaultQuota?: number; resetCircle?: number; priority?: number }): Promise<any> {
    const { data: responseData } = await apiClient.put(`/admin/chat-categories/${id}`, data);
    return responseData;
  },

  // 统计数据
  async getStats(): Promise<{
    totalUsers: number;
    activeUsers: number;
    totalPermissions: number;
    abstractGroups: number;
    groupDistribution: Record<string, number>;
    recentActivity: Array<{
      timestamp: Date;
      type: string;
      count: number;
    }>;
  }> {
    const { data } = await apiClient.get('/admin/stats');
    return data;
  },

  // 规则管理
  async getAllRules(params?: {
    page?: number;
    pageSize?: number;
    search?: string;
    type?: 'policy' | 'role';
  }): Promise<{
    rules: Array<{
      id: string;
      type: 'policy' | 'role';
      subject: string;
      domain?: string;
      object?: string;
      action?: string;
      effect?: string;
      role?: string;
      isActive: boolean;
      createdAt: string;
      updatedAt: string;
      source: string;
    }>;
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }> {
    const { data } = await apiClient.get('/admin/rules', { params });
    return data;
  },

  async addRule(rule: {
    type: 'policy' | 'role';
    subject: string;
    domain?: string;
    object?: string;
    action?: string;
    effect?: string;
    role?: string;
  }): Promise<{ success: boolean; message: string }> {
    const { data } = await apiClient.post('/admin/rules', rule);
    return data;
  },

  async updateRule(id: string, rule: {
    type: 'policy' | 'role';
    subject: string;
    domain?: string;
    object?: string;
    action?: string;
    effect?: string;
    role?: string;
  }): Promise<{ success: boolean; message: string }> {
    const { data } = await apiClient.put(`/admin/rules/${id}`, rule);
    return data;
  },

  async deleteRule(rule: any): Promise<{ success: boolean; message: string }> {
    // 复用批量操作接口来删除单条规则
    const response = await this.batchOperation({
      operation: 'remove',
      upns: [rule.subject],
      resource: rule.domain,
      resourceId: rule.object,
      action: rule.action,
      effect: rule.effect,
    });

    // batchOperation 直接返回解析后的数据，所以可以直接判断
    if (response.successCount > 0) {
      return { success: true, message: '规则删除成功' };
    } else {
      const firstResult = response.results?.[0];
      throw new Error(firstResult?.message || '删除规则失败');
    }
  },

  async batchRuleOperation(operation: {
    operation: 'delete' | 'disable' | 'enable';
    ruleIds: string[];
  }): Promise<{
    successCount: number;
    totalCount: number;
    errors: string[];
  }> {
    const { data } = await apiClient.post('/admin/rules/batch', operation);
    return data;
  },

  async getRulesForSubject(subject: string): Promise<{ rules: any[], total: number }> {
    const { data } = await apiClient.get(`/admin/rules/subject/${subject}`);
    return data;
  },

  async importRules(content: string | File, replace: boolean): Promise<{ success: boolean; message: string }> {
    if (typeof content === 'string') {
      // 文本粘贴
      const { data } = await apiClient.post('/admin/rules/import', { content, replace });
      return data;
    } else {
      // 文件上传
      const formData = new FormData();
      formData.append('file', content);
      formData.append('replace', String(replace));
      const { data } = await apiClient.post('/admin/rules/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return data;
    }
  },

  async exportAllRules(): Promise<any> {
    return apiClient.get('/admin/export/all-rules', {
      responseType: 'blob', // 重要：告诉axios我们期望一个二进制文件
    });
  },
};

export default api;
