// @ts-expect-error
/* eslint-disable */
import { request } from "@/utils/request";

/** 查询用户信息 根据UPN，返回用户的所有信息。 GET /userinfos */
export async function getUserinfos(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getUserinfosParams,
  options?: { [key: string]: any },
) {
  return request<API.UserinfosUserInfos>("/userinfos", {
    method: "GET",
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** 自定义筛选用户信息 根据过滤条件，返回用户的所有信息。支持复杂条件查询、排序和分页。 POST /userinfos/filter */
export async function postUserinfosFilter(
  body: API.FilterReq,
  options?: { [key: string]: any },
) {
  return request<API.FilterRes>("/userinfos/filter", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}
