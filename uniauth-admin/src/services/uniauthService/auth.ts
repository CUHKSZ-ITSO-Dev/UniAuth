// @ts-ignore
/* eslint-disable */
import { request } from "@/utils/request";

/** UniAuth账号密码校验 验证用户账号密码是否正确。 POST /auth/uniauth/login */
export async function postAuthUniauthLogin(
  body: { account: string; password: string },
  options?: { [key: string]: any }
) {
  return request<{ ok: boolean }>("/auth/uniauth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

/** 获取所属配额池的可用模型 动态获取指定配额池的可用模型。 GET /auth/chat/quotaPools/models */
export async function getAuthChatQuotaPoolsModels(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getAuthChatQuotaPoolsModelsParams,
  options?: { [key: string]: any }
) {
  return request<API.GetAvailableModelForQuotaPoolRes>(
    "/auth/chat/quotaPools/models",
    {
      method: "GET",
      params: {
        ...params,
      },
      ...(options || {}),
    }
  );
}

/** 基础权限检查 给定sub obj act，查询是否有权限。 POST /auth/check */
export async function postAuthCheck(
  body: API.CheckReq,
  options?: { [key: string]: any }
) {
  return request<API.CheckRes>("/auth/check", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

/** 解释权限来源 给定sub obj act，如果允许，返回使其允许的规则。 POST /auth/checkEx */
export async function postAuthCheckEx(
  body: API.CheckAndExplainReq,
  options?: { [key: string]: any }
) {
  return request<API.CheckAndExplainRes>("/auth/checkEx", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

/** 获取所属配额池 动态获取用户属于哪些配额池。 GET /auth/quotaPools/all */
export async function getAuthQuotaPoolsAll(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getAuthQuotaPoolsAllParams,
  options?: { [key: string]: any }
) {
  return request<API.GetAllQuotaPoolsRes>("/auth/quotaPools/all", {
    method: "GET",
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** 获取所属配额池的用户 动态获取指定配额池的用户。 GET /auth/quotaPools/users */
export async function getAuthQuotaPoolsUsers(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getAuthQuotaPoolsUsersParams,
  options?: { [key: string]: any }
) {
  return request<API.GetAllUsersForQuotaPoolRes>("/auth/quotaPools/users", {
    method: "GET",
    params: {
      ...params,
    },
    ...(options || {}),
  });
}
