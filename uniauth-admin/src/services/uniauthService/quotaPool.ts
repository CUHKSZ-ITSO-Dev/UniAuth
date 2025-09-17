// @ts-ignore
/* eslint-disable */
import { request } from "@/utils/request";

/** 获取配额池的详细配置 GET /quotaPool */
export async function getQuotaPool(options?: { [key: string]: any }) {
  return request<API.GetQuotaPoolRes>("/quotaPool", {
    method: "GET",
    ...(options || {}),
  });
}

/** 编辑配额池 PUT /quotaPool */
export async function putQuotaPool(
  body: API.EditQuotaPoolReq,
  options?: { [key: string]: any }
) {
  return request<API.EditQuotaPoolRes>("/quotaPool", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

/** 新建配额池 POST /quotaPool */
export async function postQuotaPool(
  body: API.NewQuotaPoolReq,
  options?: { [key: string]: any }
) {
  return request<API.NewQuotaPoolRes>("/quotaPool", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

/** 删除配额池 DELETE /quotaPool */
export async function deleteQuotaPool(options?: { [key: string]: any }) {
  return request<API.DeleteQuotaPoolRes>("/quotaPool", {
    method: "DELETE",
    ...(options || {}),
  });
}
