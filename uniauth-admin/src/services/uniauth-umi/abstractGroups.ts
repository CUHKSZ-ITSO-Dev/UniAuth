// @ts-ignore
/* eslint-disable */
import { request } from "@umijs/max";

/** 获取所有抽象组 获取系统中所有的抽象组列表 GET /api/v1/admin/abstract-groups */
export async function getAdminAbstractGroups(options?: { [key: string]: any }) {
  return request<API.AbstractGroup[]>("/api/v1/admin/abstract-groups", {
    method: "GET",
    ...(options || {}),
  });
}

/** 创建抽象组 创建新的抽象组 POST /api/v1/admin/abstract-groups */
export async function postAdminAbstractGroups(
  body: Record<string, any>,
  options?: { [key: string]: any }
) {
  return request<API.AbstractGroup>("/api/v1/admin/abstract-groups", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

/** 获取单个抽象组 根据ID获取抽象组详情 GET /api/v1/admin/abstract-groups/${param0} */
export async function getAdminAbstractGroupsId(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getAdminAbstractGroupsIdParams,
  options?: { [key: string]: any }
) {
  const { id: param0, ...queryParams } = params;
  return request<API.AbstractGroup>(`/api/v1/admin/abstract-groups/${param0}`, {
    method: "GET",
    params: { ...queryParams },
    ...(options || {}),
  });
}
