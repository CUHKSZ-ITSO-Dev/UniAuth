// @ts-ignore
/* eslint-disable */
import { request } from "@/utils/request";

/** 获取所属配额池的可用模型 动态获取指定配额池的可用模型。 GET /auth/internal/chat/quotaPools/models */
export async function getAuthChatQuotaPoolsModels(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getAuthChatQuotaPoolsModelsParams,
  options?: { [key: string]: any }
) {
  return request<API.GetAvailableModelForQuotaPoolRes>(
    "/auth/internal/chat/quotaPools/models",
    {
      method: "GET",
      params: {
        ...params,
      },
      ...(options || {}),
    }
  );
}

/** 基础权限检查 给定sub obj act，查询是否有权限。 POST /auth/internal/check */
export async function postAuthCheck(
  body: API.CheckReq,
  options?: { [key: string]: any }
) {
  return request<API.CheckRes>("/auth/internal/check", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

/** 解释权限来源 给定sub obj act，如果允许，返回使其允许的规则。 POST /auth/internal/checkEx */
export async function postAuthCheckEx(
  body: API.CheckAndExplainReq,
  options?: { [key: string]: any }
) {
  return request<API.CheckAndExplainRes>("/auth/internal/checkEx", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

/** 获取所属配额池 动态获取用户属于哪些配额池。 GET /auth/internal/quotaPools/all */
export async function getAuthQuotaPoolsAll(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getAuthQuotaPoolsAllParams,
  options?: { [key: string]: any }
) {
  return request<API.GetAllQuotaPoolsRes>("/auth/internal/quotaPools/all", {
    method: "GET",
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** 获取所属配额池的用户 动态获取指定配额池的用户。 GET /auth/admin/quotaPools/users */
export async function getAuthQuotaPoolsUsers(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getAuthQuotaPoolsUsersParams,
  options?: { [key: string]: any }
) {
  return request<API.GetAllUsersForQuotaPoolRes>("/auth/admin/quotaPools/users", {
    method: "GET",
    params: {
      ...params,
    },
    ...(options || {}),
  });
}
