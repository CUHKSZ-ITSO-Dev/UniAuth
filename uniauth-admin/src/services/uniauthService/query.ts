// @ts-ignore
/* eslint-disable */
import { request } from "@/utils/request";

/** 获取所有Actions GET /auth/admin/actions/all */
export async function getAuthAdminActionsAll(options?: { [key: string]: any }) {
  return request<API.GetAllActionsRes>("/auth/admin/actions/all", {
    method: "GET",
    ...(options || {}),
  });
}

/** 获取所有 Domains GET /auth/admin/domains/all */
export async function getAuthAdminDomainsAll(options?: { [key: string]: any }) {
  return request<API.GetAllDomainsRes>("/auth/admin/domains/all", {
    method: "GET",
    ...(options || {}),
  });
}

/** 筛选 Grouping Policies 根据给定的条件，返回 Grouping Policies 角色继承关系。留空的字段（传空 Array）将被忽略。 POST /auth/admin/groupings/filter */
export async function postAuthAdminGroupingsFilter(
  body: API.FilterGroupingsReq,
  options?: { [key: string]: any }
) {
  return request<API.FilterGroupingsRes>("/auth/admin/groupings/filter", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

/** 获取所有Objects GET /auth/admin/objects/all */
export async function getAuthAdminObjectsAll(options?: { [key: string]: any }) {
  return request<API.GetAllObjectsRes>("/auth/admin/objects/all", {
    method: "GET",
    ...(options || {}),
  });
}

/** 筛选 Policies 根据给定的条件，返回Policy。留空的字段（传空 Array）将被忽略。 POST /auth/admin/policies/filter */
export async function postAuthAdminPoliciesFilter(
  body: API.FilterPoliciesReq,
  options?: { [key: string]: any }
) {
  return request<API.FilterPoliciesRes>("/auth/admin/policies/filter", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

/** 获取所有 Roles GET /auth/admin/roles/all */
export async function getAuthAdminRolesAll(options?: { [key: string]: any }) {
  return request<API.GetAllRolesRes>("/auth/admin/roles/all", {
    method: "GET",
    ...(options || {}),
  });
}

/** 获取所有Subjects GET /auth/admin/subjects/all */
export async function getAuthAdminSubjectsAll(options?: {
  [key: string]: any;
}) {
  return request<API.GetAllSubjectsRes>("/auth/admin/subjects/all", {
    method: "GET",
    ...(options || {}),
  });
}
