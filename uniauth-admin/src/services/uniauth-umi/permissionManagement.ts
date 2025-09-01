// @ts-ignore
/* eslint-disable */
import { request } from "@umijs/max";

/** 临时禁用/启用权限 临时禁用或启用用户的特定权限 POST /api/v1/admin/toggle-permission */
export async function postAdminTogglePermission(
  body: Record<string, any>,
  options?: { [key: string]: any }
) {
  return request<Record<string, any>>("/api/v1/admin/toggle-permission", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

/** 权限检查 检查用户对指定资源的权限，支持API Key和智能权限继承 POST /api/v1/auth/check */
export async function postAuthCheck(
  body: Record<string, any>,
  options?: { [key: string]: any }
) {
  return request<Record<string, any>>("/api/v1/auth/check", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

/** 获取统计数据 GET /api/v1/admin/stats */
export async function getStats(options?: { [key: string]: any }) {
  return request<Record<string, any>>('/api/v1/admin/stats', {
    method: 'GET',
    ...(options || {}),
  });
}
