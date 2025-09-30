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
      // page has a default value: 1
      page: "1",
      // pageSize has a default value: 20
      pageSize: "20",
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

/** 确保个人配额池存在 POST /quotaPool/ensure */
export async function postQuotaPoolEnsure(
  body: API.EnsurePersonalQuotaPoolReq,
  options?: { [key: string]: any },
) {
  return request<API.EnsurePersonalQuotaPoolRes>("/quotaPool/ensure", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

/** 刷新配额池的用户 给定配额池名称列表，根据配额池配置中的 UserInfos Rules，在 Casbin 中刷新组权限继承关系。'不传参数'则刷新所有配额池。如果传空数组，则没有任何操作！ POST /quotaPool/refreshUsers */
export async function postQuotaPoolRefreshUsers(
  body: API.RefreshUsersOfQuotaPoolReq,
  options?: { [key: string]: any },
) {
  return request<API.RefreshUsersOfQuotaPoolRes>("/quotaPool/refreshUsers", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}
