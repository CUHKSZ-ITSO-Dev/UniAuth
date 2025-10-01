// @ts-expect-error
/* eslint-disable */
import { request } from "@/utils/request";

/** UniAuth账号密码校验 UniAuth账号密码校验 POST /auth/uniauth/login */
export async function postAuthUniauthLogin(
  body: API.UniauthLoginReq,
  options?: { [key: string]: any },
) {
  return request<API.UniauthLoginRes>("/auth/uniauth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}
