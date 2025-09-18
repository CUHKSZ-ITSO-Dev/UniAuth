// @ts-ignore
/* eslint-disable */
import { request } from "@/utils/request";

/** 导出账单 导出账单，根据一定的条件。有两个类型的账单：<br>1. 配额池出账（可以传Array），每个配额池的账单会在不同的工作表里面；<br>2. 个人出账（可以传Array），每个人的消费记录会在不同的工作表里面。<br>QuotaPool 数组和 UPN 数组只能同时传一个。 POST /billing/admin/export */
export async function postBillingAdminOpenApiExport(
  body: API.ExportBillRecordReq,
  options?: { [key: string]: any }
) {
  return request<API.ExportBillRecordRes>("/billing/admin/export", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

/** 查询账单 查询账单，根据一定的条件。有两个类型的账单：<br>1. 配额池出账（可以传Array），每个配额池的账单会在不同的工作表里面；<br>2. 个人出账（可以传Array），每个人的消费记录会在不同的工作表里面。<br>QuotaPool 数组和 UPN 数组只能同时传一个。 POST /billing/admin/get */
export async function postBillingAdminGet(
  body: API.GetBillRecordReq,
  options?: { [key: string]: any }
) {
  return request<API.GetBillRecordRes>("/billing/admin/get", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

/** 批量修改配额池 POST /quotaPool/admin/batchModify */
export async function postQuotaPoolAdminBatchModify(
  body: API.BatchQuotaPoolDisabledReq,
  options?: { [key: string]: any }
) {
  return request<API.BatchQuotaPoolDisabledRes>(
    "/quotaPool/admin/batchModify",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      data: body,
      ...(options || {}),
    }
  );
}

/** 重置配额池 POST /quotaPool/admin/resetBalance */
export async function postQuotaPoolAdminResetBalance(
  body: API.ResetBalanceReq,
  options?: { [key: string]: any }
) {
  return request<API.ResetBalanceRes>("/quotaPool/admin/resetBalance", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}
