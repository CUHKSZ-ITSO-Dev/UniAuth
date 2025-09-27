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
  body: API.DeleteAutoQuotaPoolConfigReq,
  options?: { [key: string]: any },
) {
  return request<API.DeleteAutoQuotaPoolConfigRes>("/config/autoConfig", {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}
