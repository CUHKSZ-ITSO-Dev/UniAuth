// @ts-expect-error
/* eslint-disable */
import { request } from "@/utils/request";

/** 检查余额 刷新、检查配额池的余额。 POST /billing/check */
export async function postBillingCheck(
  body: API.CheckBalanceReq,
  options?: { [key: string]: any },
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
  options?: { [key: string]: any },
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

/** 计费接口 上传计费请求，完成配额池的扣费。 POST /billing/record */
export async function postBillingRecord(
  body: API.BillingRecordReq,
  options?: { [key: string]: any },
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

/** 获取计费选项 获取指定配额池的所有服务和产品类型选项 POST /billing/options */
export async function postBillingOptions(
  body: API.GetBillingOptionsReq,
  options?: { [key: string]: any },
) {
  return request<API.GetBillingOptionsRes>("/billing/options", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}
