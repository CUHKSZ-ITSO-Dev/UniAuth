/* eslint-disable */
import { request } from "@/utils/request";

/** 编辑i18n项目 编辑一项i18n配置的翻译 PUT /config/i18n */
export async function putConfigI18N(
  body: API.EditI18nItemReq,
  options?: { [key: string]: any },
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

/** 添加i18n项目 添加一项i18n配置，包含多个语言的翻译 POST /config/i18n */
export async function postConfigI18N(
  body: API.AddI18nItemReq,
  options?: { [key: string]: any },
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

/** 删除i18n配置 删除指定Key的i18n配置项 DELETE /config/i18n */
export async function deleteConfigI18N(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.deleteConfigI18nParams,
  options?: { [key: string]: any },
) {
  return request<API.DeleteI18ConfigRes>("/config/i18n", {
    method: "DELETE",
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** 筛选i18n配置 根据关键词筛选i18n配置，支持排序和分页 POST /config/i18n/filter */
export async function postConfigI18NFilter(
  body: API.FilterI18nReq,
  options?: { [key: string]: any },
) {
  return request<API.FilterI18nRes>("/config/i18n/filter", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

/** 获取i18n语言包 获取指定语言的所有翻译配置 GET /config/i18n/lang */
export async function getConfigI18NLang(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getConfigI18nLangParams,
  options?: { [key: string]: any },
) {
  return request<API.GetI18nConfigRes>("/config/i18n/lang", {
    method: "GET",
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** 获取所有支持的语言列表 获取系统支持的所有语言代码 GET /config/i18n/langs */
export async function getConfigI18NLangs(options?: { [key: string]: any }) {
  return request<API.GetAllLangsRes>("/config/i18n/langs", {
    method: "GET",
    ...(options || {}),
  });
}
