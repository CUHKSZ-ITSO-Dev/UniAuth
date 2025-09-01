// @ts-ignore
/* eslint-disable */
import { request } from "@umijs/max";

/** 获取用户权限树 获取指定用户的完整权限树结构 GET /api/v1/admin/user/${param0}/permissions */
export async function getAdminUserUpnPermissions(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getAdminUserUpnPermissionsParams,
  options?: { [key: string]: any }
) {
  const { upn: param0, ...queryParams } = params;
  return request<Record<string, any>>(
    `/api/v1/admin/user/${param0}/permissions`,
    {
      method: "GET",
      params: { ...queryParams },
      ...(options || {}),
    }
  );
}
