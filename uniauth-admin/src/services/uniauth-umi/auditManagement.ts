// @ts-ignore
/* eslint-disable */
import { request } from "@umijs/max";

/** 获取审计历史 获取系统的审计历史记录，支持分页和过滤 GET /api/v1/admin/audit/logs */
export async function getAdminAuditLogs(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getAdminAuditLogsParams,
  options?: { [key: string]: any }
) {
  return request<API.AuditLogEntry[]>("/api/v1/admin/audit/logs", {
    method: "GET",
    params: {
      // days has a default value: 30
      days: "30",
      // page has a default value: 1
      page: "1",
      // pageSize has a default value: 50
      pageSize: "50",

      ...params,
    },
    ...(options || {}),
  });
}
