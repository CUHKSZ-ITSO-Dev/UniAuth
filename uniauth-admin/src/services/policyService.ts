import { request } from '@umijs/max';

export interface PolicyFilterRequest {
  subs?: string[];
  objs?: string[];
  acts?: string[];
}

export interface PolicyFilterResponse {
  policies: string[][];
}

export interface PolicyAddRequest {
  polices: string[][];
  skip?: boolean;
}

export interface PolicyDeleteRequest {
  polices: string[][];
}

export interface PolicyEditRequest {
  oldPolicy: string;
  newPolicy: string[];
}

/**
 * 筛选规则
 */
export async function filterPolicies(data: PolicyFilterRequest) {
  return request<PolicyFilterResponse>('/auth/admin/policies/filter', {
    method: 'POST',
    data,
  });
}

/**
 * 添加规则
 */
export async function addPolicies(data: PolicyAddRequest) {
  return request<Record<string, never>>('/auth/admin/policies/add', {
    method: 'POST',
    data,
  });
}

/**
 * 删除规则
 */
export async function deletePolicies(data: PolicyDeleteRequest) {
  return request<Record<string, never>>('/auth/admin/policies/delete', {
    method: 'POST',
    data,
  });
}

/**
 * 编辑规则
 */
export async function editPolicy(data: PolicyEditRequest) {
  return request<Record<string, never>>('/auth/admin/policies/edit', {
    method: 'POST',
    data,
  });
}