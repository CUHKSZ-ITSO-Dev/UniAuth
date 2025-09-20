// @ts-expect-error
/* eslint-disable */
import { request } from "@/utils/request";

/** 获取配额池的详细配置 GET /quotaPool */
export async function getQuotaPool(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getQuotaPoolParams,
  options?: { [key: string]: any },
) {
  return request<API.GetQuotaPoolRes>("/quotaPool", {
    method: "GET",
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** 编辑配额池 PUT /quotaPool */
export async function putQuotaPool(
  body: API.EditQuotaPoolReq,
  options?: { [key: string]: any },
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
  options?: { [key: string]: any },
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
export async function deleteQuotaPool(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.deleteQuotaPoolParams,
  options?: { [key: string]: any },
) {
  return request<API.DeleteQuotaPoolRes>("/quotaPool", {
    method: "DELETE",
    params: {
      ...params,
    },
    ...(options || {}),
  });
}
