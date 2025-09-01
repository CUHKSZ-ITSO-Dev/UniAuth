// @ts-ignore
/* eslint-disable */
import { request } from "@umijs/max";

/** 更新对话类别 更新用户组（对话类别）信息 PUT /api/v1/admin/chat-categories/${param0} */
export async function putAdminChatCategoriesId(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.putAdminChatCategoriesIdParams,
  body: Record<string, any>,
  options?: { [key: string]: any }
) {
  const { id: param0, ...queryParams } = params;
  return request<Record<string, any>>(
    `/api/v1/admin/chat-categories/${param0}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      params: { ...queryParams },
      data: body,
      ...(options || {}),
    }
  );
}

/** 计费 对指定用户进行计费扣款 POST /api/v1/chat/bill */
export async function postChatBill(
  body: API.BillRequest,
  options?: { [key: string]: any }
) {
  return request<Record<string, any>>("/api/v1/chat/bill", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

/** 确保聊天账户存在 确保用户的聊天账户存在，如果不存在则创建 POST /api/v1/chat/ensure-account */
export async function postChatEnsureAccount(
  body: API.EnsureChatAccountExistsRequest,
  options?: { [key: string]: any }
) {
  return request<Record<string, any>>("/api/v1/chat/ensure-account", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

/** 重置余额 重置指定用户的余额 POST /api/v1/chat/reset-balance */
export async function postChatResetBalance(
  body: API.ResetBalanceRequest,
  options?: { [key: string]: any }
) {
  return request<Record<string, any>>("/api/v1/chat/reset-balance", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}
