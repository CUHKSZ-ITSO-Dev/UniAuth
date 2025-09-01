// @ts-ignore
/* eslint-disable */
import { request } from "@umijs/max";

/** 基础权限检查 给定sub obj act dom，查询是否有权限。 POST /auth/check */
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

/** 解释权限来源 给定sub obj act dom，如果允许，返回使其允许的规则。 POST /auth/checkEx */
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
