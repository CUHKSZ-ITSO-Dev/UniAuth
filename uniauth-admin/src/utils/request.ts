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

  if (res.data.code !== 0) {
    throw new Error(res.data.message || "请求失败");
  }

  return res.data.data;
}
