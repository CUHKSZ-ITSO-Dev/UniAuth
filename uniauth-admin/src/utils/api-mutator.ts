import { request as umiRequest } from "@umijs/max";

interface ResponseStructure<T> {
  code: number;
  message: string;
  data: T;
}

/**
 * 适配 orval 生成的 API 调用
 * 该函数由 orval 自动调用，签名为：
 * <T>(config: RequestConfig, options?: any): Promise<T>
 */
export const customApiMutator = async <T>(
  config: {
    method: string;
    url: string;
    params?: any;
    data?: any;
    responseType?: string;
    signal?: AbortSignal;
    headers?: Record<string, string>;
  },
  options?: any,
): Promise<T> => {
  const { method, url, params, data, responseType, signal, headers } = config;

  // 构建 umi request 的选项
  const requestOptions: any = {
    method: method.toUpperCase(),
    getResponse: true,
    params,
    signal,
    ...options,
  };

  // 如果有请求头，添加到 headers
  if (headers) {
    requestOptions.headers = headers;
  }

  // 如果有请求体（POST/PUT/PATCH），设置 data
  if (data) {
    requestOptions.data = data;
  }

  // 处理 responseType
  if (responseType === "blob" || responseType === "arraybuffer") {
    requestOptions.responseType = responseType;
  }

  const res = await umiRequest<ResponseStructure<T>>(url, requestOptions);

  // 检查响应的 Content-Type 来判断是否为 JSON 响应
  const contentType = res.headers?.["content-type"] || "";
  const isJsonResponse = contentType.includes("application/json");

  // 对于文件下载请求（明确指定了 responseType），直接返回原始响应数据
  if (responseType === "arraybuffer" || responseType === "blob") {
    return res.data as T;
  }

  // 对于非 JSON 响应（如文件下载），直接返回原始响应数据
  if (!isJsonResponse) {
    return res.data as T;
  }

  // 对于 JSON 响应，检查标准的响应结构
  const responseData = res.data as ResponseStructure<T>;

  // 确保 responseData 是对象且包含 code 字段
  if (
    typeof responseData === "object" &&
    responseData !== null &&
    "code" in responseData
  ) {
    if (responseData.code !== 0) {
      throw new Error(responseData.message || "请求失败");
    }
    return responseData.data;
  }

  // 如果是 JSON 但不符合标准结构，直接返回原始数据中的 data 字段（业务数据）
  return res.data.data as T;
};

export default customApiMutator;

export type ErrorType<Error> = Error;
