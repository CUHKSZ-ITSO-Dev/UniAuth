import { request as umiRequest } from "@umijs/max";

interface ResponseStructure<T> {
  code: number;
  message: string;
  data: T;
}

export async function request<T>(url: string, options?: any): Promise<T> {
  const res = await umiRequest<ResponseStructure<T>>(url, {
    getResponse: true,
    ...options,
  });

  // 检查响应的 Content-Type 来判断是否为 JSON 响应
  const contentType = res.headers?.["content-type"] || "";
  const isJsonResponse = contentType.includes("application/json");

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
}
