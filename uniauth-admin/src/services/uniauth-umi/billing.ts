// @ts-ignore
/* eslint-disable */
import { request } from "@umijs/max";

/** 检查是否可以使用某个产品 根据给定的参数，检查是否可以使用某个产品。 POST /billing/check */
export async function postBillingCheck(
  body: API.CheckBalanceReq,
  options?: { [key: string]: any }
) {
  return request<API.CheckBalanceRes>("/billing/check", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

/** 检查Tokens使用情况 检查Tokens使用情况 POST /billing/checkTokensUsage */
export async function postBillingCheckTokensUsage(
  body: API.CheckTokensUsageReq,
  options?: { [key: string]: any }
) {
  return request<API.CheckTokensUsageRes>("/billing/checkTokensUsage", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

/** 计费接口 xxxxxxxx计费接口 POST /billing/record */
export async function postBillingRecord(
  body: API.BillingRecordReq,
  options?: { [key: string]: any }
) {
  return request<API.BillingRecordRes>("/billing/record", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}
