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

/** 查询指定UPN列表是否在指定自动配额池规则的upns_cache中 POST /config/autoConfig/queryUpnsCache */
export async function getConfigAutoConfigQueryUpnsCache(
  // 使用body参数传递请求数据
  body: API.getConfigAutoConfigQueryUpnsCacheParams,
  options?: { [key: string]: any },
) {
  return request<API.QueryUpnsCacheRes>("/config/autoConfig/queryUpnsCache", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}
