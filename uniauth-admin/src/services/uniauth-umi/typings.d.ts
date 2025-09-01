declare namespace API {
  type AbstractGroup = {
    /** 创建时间 */
    createdAt?: string;
    /** 创建者UPN */
    creatorUpn?: string;
    /** 删除时间（软删除） */
    deletedAt?: string;
    /** 抽象组描述 */
    description?: string;
    /** 主键ID */
    id?: number;
    /** 抽象组名称 */
    name?: string;
    /** 抽象组规则 */
    rule?: AbstractGroupRule;
    /** 抽象组类型："ittools" 或 "manual" */
    type?: string;
    /** 更新时间 */
    updatedAt?: string;
  };

  type AbstractGroupRule = {
    /** ITTools 类型规则 */
    ittools?: IttoolsRule;
    /** 手动类型规则 */
    manual?: ManualRule;
  };

  type AuditLogEntry = {
    /** 操作 */
    action?: string;
    /** 创建时间 */
    createdAt?: string;
    /** 详细信息（JSON字符串） */
    details?: string;
    /** 主键ID */
    id?: number;
    /** IP地址 */
    ipAddress?: string;
    /** 资源 */
    resource?: string;
    /** 是否成功 */
    success?: boolean;
    /** 时间戳 */
    timestamp?: string;
    /** 用户 */
    user?: string;
    /** 用户代理 */
    userAgent?: string;
  };

  type BillRequest = {
    /** 费用（字符串格式） */
    cost: string;
    /** 使用的模型 */
    model: string;
    /** 消耗的token数量 */
    tokens: number;
    /** 用户UPN */
    upn: string;
  };

  type Condition = {
    /** 字段名 */
    field?: string;
    /** 操作符 */
    operator?: string;
    /** 字段值 */
    value?: string;
  };

  type EnsureChatAccountExistsRequest = {
    /** 用户UPN */
    upn: string;
  };

  type getAdminAbstractGroupsIdParams = {
    /** 抽象组ID */
    id: string;
  };

  type getAdminAuditLogsParams = {
    /** 查询天数 */
    days?: number;
    /** 页码 */
    page?: number;
    /** 每页大小 */
    pageSize?: number;
    /** 用户过滤 */
    user?: string;
    /** 操作类型过滤 */
    action?: string;
  };

  type getAdminRulesParams = {
    /** 页码 */
    page?: number;
    /** 每页大小 */
    pageSize?: number;
    /** 搜索关键词 */
    search?: string;
    /** 规则类型 */
    type?: "policy" | "role";
  };

  type getAdminUserUpnPermissionsParams = {
    /** 用户UPN */
    upn: string;
  };

  type IttoolsRule = {
    /** 条件列表 */
    conditions?: Condition[];
    /** 逻辑操作符："AND" 或 "OR" */
    logical_operator?: string;
  };

  type ManualRule = {
    /** 用户UPN列表 */
    upns?: string[];
  };

  type putAdminChatCategoriesIdParams = {
    /** 对话类别ID */
    id: string;
  };

  type ResetBalanceRequest = {
    /** 是否强制重置 */
    reset_anyway?: boolean;
    /** 用户UPN */
    upn: string;
  };

  type Rule = {
    /** 动作 */
    action?: string;
    /** 创建时间 */
    createdAt?: string;
    /** 资源域 */
    domain?: string;
    /** 效果：allow/deny */
    effect?: string;
    /** 规则ID */
    id?: string;
    /** 是否启用 */
    isActive?: boolean;
    /** 资源对象 */
    object?: string;
    /** 角色（仅用于role类型） */
    role?: string;
    /** 来源："database" 或 "csv" */
    source?: string;
    /** 用户或组 */
    subject?: string;
    /** 规则类型："policy" 或 "role" */
    type?: string;
    /** 更新时间 */
    updatedAt?: string;
  };
}
