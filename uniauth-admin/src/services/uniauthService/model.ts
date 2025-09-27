// @ts-ignore
/* eslint-disable */
import { request } from "@/utils/request";

/** 编辑模型配置 编辑模型配置。 PUT /config/admin/model */
export async function putConfigModel(
  body: API.EditModelConfigReq,
  options?: { [key: string]: any }
) {
  return request<API.EditModelConfigRes>("/config/admin/model", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

/** 添加模型配置 POST /config/admin/model */
export async function postConfigModel(
  body: API.AddModelConfigReq,
  options?: { [key: string]: any }
) {
  return request<API.AddModelConfigRes>("/config/admin/model", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

/** 删除模型配置 DELETE /config/admin/model */
export async function deleteConfigModel(options?: { [key: string]: any }) {
  return request<API.DeleteModelConfigRes>("/config/admin/model", {
    method: "DELETE",
    ...(options || {}),
  });
}

/** 获取配置 GET /config/admin/model/all */
export async function getConfigModelAll(options?: { [key: string]: any }) {
  return request<API.GetModelConfigRes>("/config/admin/model/all", {
    method: "GET",
    ...(options || {}),
  });
}
