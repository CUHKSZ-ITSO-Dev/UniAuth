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

/** 今日总消费 获取今天的总消费金额统计 GET /billing/stats/today/total */
export async function getBillingStatsTodayTotal(
  params: API.GetTodayTotalConsumptionReq,
  options?: { [key: string]: any },
) {
  return request<API.GetTodayTotalConsumptionRes>(
    "/billing/stats/today/total",
    {
      method: "GET",
      params,
      ...(options || {}),
    },
  );
}

/** 活跃用户统计 按消费记录查询活跃用户 GET /billing/stats/active-users/summary */
export async function getBillingStatsActiveUsersSummary(
  params: API.GetActiveUsersNumReq,
  options?: { [key: string]: any },
) {
  return request<API.GetActiveUsersNumRes>(
    "/billing/stats/active-users/summary",
    {
      method: "GET",
      params,
      ...(options || {}),
    },
  );
}

/** 获取所有活跃用户列表 获取指定天数内的活跃用户信息 GET /billing/stats/active-users/list */
export async function getBillingStatsActiveUsersList(
  params: API.GetAllActiveUsersReq,
  options?: { [key: string]: any },
) {
  return request<API.GetAllActiveUsersRes>("/billing/stats/active-users/list", {
    method: "GET",
    params,
    ...(options || {}),
  });
}

/** 对话服务使用次数统计（详细） 获取N天内对话服务使用次数统计图表 GET /billing/stats/chat/usage/chart */
export async function getBillingStatsChatUsageChart(
  params: API.NDaysProductUsageChartReq,
  options?: { [key: string]: any },
) {
  return request<API.NDaysProductUsageChartRes>(
    "/billing/stats/chat/usage/chart",
    {
      method: "GET",
      params,
      ...(options || {}),
    },
  );
}

/** 对话服务使用次数统计（聚合） 获取N天内对话服务使用次数统计聚合 GET /billing/stats/chat/usage/group */
export async function getBillingStatsChatUsageGroup(
  params: API.NDaysProductUsageGroupReq,
  options?: { [key: string]: any },
) {
  return request<API.NDaysProductUsageGroupRes>(
    "/billing/stats/chat/usage/group",
    {
      method: "GET",
      params,
      ...(options || {}),
    },
  );
}

/** 模型消费金额统计 获取最近N天模型消费金额统计 GET /billing/stats/model/consumption */
export async function getBillingStatsModelConsumption(
  params: API.GetProductConsumptionReq,
  options?: { [key: string]: any },
) {
  return request<API.GetProductConsumptionRes>(
    "/billing/stats/model/consumption",
    {
      method: "GET",
      params,
      ...(options || {}),
    },
  );
}

/** 模型调用次数图表 获取最近N天模型调用次数图表（折线+条形图） GET /billing/stats/model/usage */
export async function getBillingStatsModelUsage(
  params: API.GetProductUsageChartReq,
  options?: { [key: string]: any },
) {
  return request<API.GetProductUsageChartRes>("/billing/stats/model/usage", {
    method: "GET",
    params,
    ...(options || {}),
  });
}

/** 获取所有名称 获取指定类型的名称列表 GET /billing/stats/service/list */
export async function getBillingStatsAllName(
  params: API.GetAllNameReq,
  options?: { [key: string]: any },
) {
  return request<API.GetAllNameRes>("/billing/stats/service/list", {
    method: "GET",
    params,
    ...(options || {}),
  });
}
