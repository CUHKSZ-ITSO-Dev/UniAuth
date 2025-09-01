// @ts-ignore
/* eslint-disable */
import { request } from "@umijs/max";

/** 添加 Policy 添加 Policy。 POST /auth/admin/policies/add */
export async function postAuthAdminPoliciesAdd(
  body: API.AddPolicyReq,
  options?: { [key: string]: any }
) {
  return request<API.AddPolicyRes>("/auth/admin/policies/add", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

/** 删除 Policy 删除 Policy。 POST /auth/admin/policies/delete */
export async function postAuthAdminPoliciesOpenApiDelete(
  body: API.DeletePolicyReq,
  options?: { [key: string]: any }
) {
  return request<API.DeletePolicyRes>("/auth/admin/policies/delete", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

/** 编辑 Policy 编辑 Policy。需要提供老的 Policy。<br>注意顺序是 Sub Dom Obj Act。 POST /auth/admin/policies/edit */
export async function postAuthAdminPoliciesEdit(
  body: API.EditPolicyReq,
  options?: { [key: string]: any }
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
