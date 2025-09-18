// @ts-ignore
/* eslint-disable */
import { request } from "@/utils/request";

/** 对话服务一站式权限预检查 对话服务开启计费流程前的一站式权限检查，会进行以下检查：<br>1. 检查配额池是否存在；<br>2. 检查配额池是否被禁用；<br>3. 检查用户有没有权限使用这个配额池；<br>4. 检查配额池有没有权限使用这个 Svc 和 Product。 POST /auth/chat/oneStop */
export async function postAuthChatOneStop(
  body: API.ChatPreCheckOneStopReq,
  options?: { [key: string]: any }
) {
  return request<API.ChatPreCheckOneStopRes>("/auth/chat/oneStop", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}
