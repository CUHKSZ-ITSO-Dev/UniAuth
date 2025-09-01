// @ts-ignore
/* eslint-disable */
import { request } from "@umijs/max";

/** 获取所有规则 获取系统中的所有规则，支持分页和搜索 GET /api/v1/admin/rules */
export async function getAdminRules(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getAdminRulesParams,
  options?: { [key: string]: any }
) {
  return request<API.Rule[]>("/api/v1/admin/rules", {
    method: "GET",
    params: {
      // page has a default value: 1
      page: "1",
      // pageSize has a default value: 50
      pageSize: "50",

      ...params,
    },
    ...(options || {}),
  });
}
