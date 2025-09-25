/* eslint-disable */
import { request } from "@/utils/request";

/** 添加 Policies POST /auth/admin/policies/add */
export async function postAuthAdminPoliciesAdd(
  body: API.AddPoliciesReq,
  options?: { [key: string]: any },
) {
  return request<API.AddPoliciesRes>("/auth/admin/policies/add", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

/** 删除 Policies 删除 Policies。原子性操作，当规则中有一条和数据库中的规则不匹配，立即回滚所有操作并返回错误。 POST /auth/admin/policies/delete */
export async function postAuthAdminPoliciesOpenApiDelete(
  body: API.DeletePoliciesReq,
  options?: { [key: string]: any },
) {
  return request<API.DeletePoliciesRes>("/auth/admin/policies/delete", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

/** 编辑 Policy 编辑 Policy。需要提供老的 Policy。<br>注意顺序是 Sub Obj Act。 POST /auth/admin/policies/edit */
export async function postAuthAdminPoliciesEdit(
  body: API.EditPolicyReq,
  options?: { [key: string]: any },
) {
  return request<API.EditPolicyRes>("/auth/admin/policies/edit", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}
