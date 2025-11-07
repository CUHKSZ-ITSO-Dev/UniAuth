/* eslint-disable */
import { request } from "@/utils/request";

/** 获取自动配额池规则 GET /config/autoConfig */
export async function getConfigAutoConfig(options?: { [key: string]: any }) {
  return request<API.GetAutoQuotaPoolConfigRes>("/config/autoConfig", {
    method: "GET",
    ...(options || {}),
  });
}

/** 编辑自动配额池规则 PUT /config/autoConfig */
export async function putConfigAutoConfig(
  body: API.EditAutoQuotaPoolConfigReq,
  options?: { [key: string]: any },
) {
  return request<API.EditAutoQuotaPoolConfigRes>("/config/autoConfig", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

/** 新增自动配额池规则 POST /config/autoConfig */
export async function postConfigAutoConfig(
  body: API.AddAutoQuotaPoolConfigReq,
  options?: { [key: string]: any },
) {
  return request<API.AddAutoQuotaPoolConfigRes>("/config/autoConfig", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

/** 删除自动配额池规则 DELETE /config/autoConfig */
export async function deleteConfigAutoConfig(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.deleteConfigAutoConfigParams,
  options?: { [key: string]: any },
) {
  return request<API.DeleteAutoQuotaPoolConfigRes>("/config/autoConfig", {
    method: "DELETE",
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** 手动同步自动配额池规则的 upns_cache POST /config/autoConfig/syncUpnsCache */
export async function postConfigAutoConfigSyncUpnsCache(
  body: API.SyncAutoQuotaPoolUpnsCacheReq,
  options?: { [key: string]: any },
) {
  return request<API.SyncAutoQuotaPoolUpnsCacheRes>(
    "/config/autoConfig/syncUpnsCache",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      data: body,
      ...(options || {}),
    },
  );
}

/** 获取问题数量统计 GET /config/stats/questionCount */
export async function getConfigStatsQuestionCount(options?: {
  [key: string]: any;
}) {
  return request<API.GetQuestionCountStatsRes>("/config/stats/questionCount", {
    method: "GET",
    ...(options || {}),
  });
}

/** 获取使用量统计 GET /config/stats/usage */
export async function getConfigStatsUsage(options?: { [key: string]: any }) {
  return request<API.GetUsageStatsRes>("/config/stats/usage", {
    method: "GET",
    ...(options || {}),
  });
}

/** 获取用户数量统计 GET /config/stats/userCount */
export async function getConfigStatsUserCount(options?: {
  [key: string]: any;
}) {
  return request<API.GetUserCountStatsRes>("/config/stats/userCount", {
    method: "GET",
    ...(options || {}),
  });
}
