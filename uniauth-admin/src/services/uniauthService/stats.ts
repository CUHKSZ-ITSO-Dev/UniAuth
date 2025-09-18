// @ts-ignore
/* eslint-disable */
import { request } from "@/utils/request";

/** 对话服务产品使用次数统计接口（详细） 可以传入最近N天参数。 GET /billing/stats/chat/usage/chart */
export async function getBillingStatsChatUsageChart(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getBillingStatsChatUsageChartParams,
  options?: { [key: string]: any }
) {
  return request<API.NDaysProductUsageChartRes>(
    "/billing/stats/chat/usage/chart",
    {
      method: "GET",
      params: {
        // N has a default value: 7
        N: "7",
        ...params,
      },
      ...(options || {}),
    }
  );
}

/** 对话服务产品使用次数统计接口（聚合） 可以传入最近N天参数。 GET /billing/stats/chat/usage/group */
export async function getBillingStatsChatUsageGroup(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getBillingStatsChatUsageGroupParams,
  options?: { [key: string]: any }
) {
  return request<API.NDaysProductUsageGroupRes>(
    "/billing/stats/chat/usage/group",
    {
      method: "GET",
      params: {
        // N has a default value: 7
        N: "7",
        ...params,
      },
      ...(options || {}),
    }
  );
}
