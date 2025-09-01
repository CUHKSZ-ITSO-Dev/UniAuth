// @ts-ignore
/* eslint-disable */
import { request } from "@umijs/max";

/** You first hello api GET /hello */
export async function getHello(options?: { [key: string]: any }) {
  return request<API.HelloRes>("/hello", {
    method: "GET",
    ...(options || {}),
  });
}
