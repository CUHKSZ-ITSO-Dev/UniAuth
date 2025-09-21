// @ts-expect-error
/* eslint-disable */
import { request } from "@/utils/request";

/** 编辑模型配置 编辑模型配置。 PUT /config/model */
export async function putConfigModel(
  body: API.EditModelConfigReq,
  options?: { [key: string]: any },
) {
  return request<API.EditModelConfigRes>("/config/model", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

/** 添加模型配置 POST /config/model */
export async function postConfigModel(
  body: API.AddModelConfigReq,
  options?: { [key: string]: any },
) {
  return request<API.AddModelConfigRes>("/config/model", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

/** 删除模型配置 DELETE /config/model */
export async function deleteConfigModel(
  body: API.DeleteModelConfigReq,
  options?: { [key: string]: any },
) {
  return request<API.DeleteModelConfigRes>("/config/model", {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

/** 获取配置 GET /config/model/all */
export async function getConfigModelAll(options?: { [key: string]: any }) {
  return request<API.GetModelConfigRes>("/config/model/all", {
    method: "GET",
    ...(options || {}),
  });
}
