// @ts-ignore
/* eslint-disable */
import { request } from "@/utils/request";

/** 获取所有语言的列表 GET /config/i18n */
export async function getConfigI18N(options?: { [key: string]: any }) {
  return request<API.GetAllLangsRes>("/config/i18n", {
    method: "GET",
    ...(options || {}),
  });
}

/** 编辑i18n 编辑一项i18n一个语言的配置 PUT /config/i18n */
export async function putConfigI18N(
  body: API.EditI18nItemReq,
  options?: { [key: string]: any }
) {
  return request<API.EditI18nItemRes>("/config/i18n", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

/** 添加i18n 添加一项i18n一个语言的配置 POST /config/i18n */
export async function postConfigI18N(
  body: API.AddI18nItemReq,
  options?: { [key: string]: any }
) {
  return request<API.AddI18nItemRes>("/config/i18n", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

/** 删除i18n 删除指定Key的所有语言配置。 DELETE /config/i18n */
export async function deleteConfigI18N(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.deleteConfigI18nParams,
  options?: { [key: string]: any }
) {
  return request<API.DeleteI18ConfigRes>("/config/i18n", {
    method: "DELETE",
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** 获取i18n 获取一个语言的所有翻译配置 GET /config/i18n/${lang} */
export async function getConfigI18NLang(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getConfigI18nLangParams,
  options?: { [key: string]: any }
) {
  return request<API.GetI18nConfigRes>(`/config/i18n/${lang}`, {
    method: "GET",
    params: {
      ...params,
    },
    ...(options || {}),
  });
}
