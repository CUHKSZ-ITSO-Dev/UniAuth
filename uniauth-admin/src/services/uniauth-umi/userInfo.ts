// @ts-ignore
/* eslint-disable */
import { request } from "@umijs/max";

/** 查询用户信息 根据UPN，返回用户的所有信息。 GET /users/userinfo/${upn} */
export async function getUsersUserinfoUpn(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getUsersUserinfoUpnParams,
  options?: { [key: string]: any }
) {
  return request<API.GetOneRes>(`/users/userinfo/${params.upn}`, {
    method: "GET",
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** 自定义筛选用户信息 根据过滤条件，返回用户的所有信息。支持复杂条件查询、排序和分页。 POST /users/userinfo/filter */
export async function postUsersUserinfoFilter(
  body: API.FilterReq,
  options?: { [key: string]: any }
) {
  return request<API.FilterRes>("/users/userinfo/filter", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}
