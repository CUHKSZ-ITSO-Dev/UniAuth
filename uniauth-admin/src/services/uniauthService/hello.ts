// @ts-expect-error
/* eslint-disable */
import { request } from "@/utils/request";

/** You first hello api GET /hello */
export async function getHello(options?: { [key: string]: any }) {
  return request<API.HelloRes>("/hello", {
    method: "GET",
    ...(options || {}),
  });
}
