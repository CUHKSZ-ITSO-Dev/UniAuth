// @ts-ignore
/* eslint-disable */
import { request } from "@/utils/request";

/** 获取自动配额池规则 GET /config/admin/autoConfig */
export async function getConfigAutoConfig(options?: { [key: string]: any }) {
  return request<API.GetAutoQuotaPoolConfigRes>("/config/admin/autoConfig", {
    method: "GET",
    ...(options || {}),
  });
}

/** 编辑自动配额池规则 PUT /config/admin/autoConfig */
export async function putConfigAutoConfig(
  body: API.EditAutoQuotaPoolConfigReq,
  options?: { [key: string]: any }
) {
  return request<API.EditAutoQuotaPoolConfigRes>("/config/admin/autoConfig", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

/** 新增自动配额池规则 POST /config/admin/autoConfig */
export async function postConfigAutoConfig(
  body: API.AddAutoQuotaPoolConfigReq,
  options?: { [key: string]: any }
) {
  return request<API.AddAutoQuotaPoolConfigRes>("/config/admin/autoConfig", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

/** 删除自动配额池规则 DELETE /config/admin/autoConfig */
export async function deleteConfigAutoConfig(options?: { [key: string]: any }) {
  return request<API.DeleteAutoQuotaPoolConfigRes>("/config/admin/autoConfig", {
    method: "DELETE",
    ...(options || {}),
  });
}
