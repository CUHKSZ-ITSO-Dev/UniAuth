import { AbstractGroup, ChatCategory } from '../types/abstractGroup';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1/admin';

// 获取所有抽象组
export const getAllAbstractGroups = async (): Promise<AbstractGroup[]> => {
  const response = await fetch(`${API_BASE_URL}/abstract-groups`);
  if (!response.ok) {
    throw new Error('Failed to fetch abstract groups');
  }
  return response.json();
};

// 创建新的抽象组
export const createAbstractGroup = async (groupData: Omit<AbstractGroup, 'id' | 'createdAt' | 'updatedAt' | 'creatorUpn'>): Promise<AbstractGroup> => {
  const response = await fetch(`${API_BASE_URL}/abstract-groups`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(groupData),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to create abstract group');
  }
  return response.json();
};

// 更新抽象组
export const updateAbstractGroup = async (id: string, groupData: Partial<AbstractGroup>): Promise<AbstractGroup> => {
    const response = await fetch(`${API_BASE_URL}/abstract-groups/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(groupData)
    });
    if (!response.ok) {
        throw new Error('Failed to update abstract group');
    }
    return response.json();
}

// 删除抽象组
export const deleteAbstractGroup = async (id: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/abstract-groups/${id}`, {
        method: 'DELETE',
    });
    if (!response.ok) {
        throw new Error('Failed to delete abstract group');
    }
}

// 同步抽象组
export const syncAbstractGroup = async (id: string): Promise<{ message: string; synced_users: number }> => {
    const response = await fetch(`${API_BASE_URL}/abstract-groups/${id}/sync`, {
        method: 'POST',
    });
    if (!response.ok) {
        throw new Error('Failed to sync abstract group');
    }
    return response.json();
}

// 更新用户组（ChatCategory）
export const updateChatCategory = async (id: number, categoryData: Partial<ChatCategory>): Promise<ChatCategory> => {
    const response = await fetch(`${API_BASE_URL}/chat-categories/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(categoryData),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update chat category');
    }
    return response.json();
};

// 重置余额
export const resetBalance = async (upn: string, resetAnyway: boolean = false): Promise<void> => {
    const response = await fetch('/api/v1/chat/reset-balance', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            upn,
            reset_anyway: resetAnyway
        }),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to reset balance');
    }
};
