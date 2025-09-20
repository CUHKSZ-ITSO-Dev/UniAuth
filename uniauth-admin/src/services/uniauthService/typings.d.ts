declare namespace API {
  type AddAutoQuotaPoolConfigReq = {};

  type AddAutoQuotaPoolConfigRes = {
    /** 是否成功 */
    ok?: boolean;
  };

  type AddI18nItemReq = {
    /** 语言 */
    lang: string;
    /** 键 */
    key: string;
    /** 值 */
    value: string;
  };

  type AddI18nItemRes = {
    /** 是否成功 */
    ok?: boolean;
  };

  type AddModelConfigReq = {};

  type AddModelConfigRes = {
    /** 配置 */
    config?: string;
  };

  type AddPoliciesReq = {
    /** Policies */
    policies: string[][];
    /** 开启时，当规则已经存在时自动跳过，不返回错误；否则会返回错误，并回退所有操作 */
    skip?: boolean;
  };

  type AddPoliciesRes = {};

  type BatchQuotaPoolDisabledReq = {
    /** 配额池 */
    quotaPools: string[];
    /** 字段 */
    field: string;
    /** 值 */
    value: boolean;
  };

  type BatchQuotaPoolDisabledRes = {
    /** 是否成功 */
    ok?: boolean;
    /** 错误信息 */
    err?: string;
  };

  type BillingRecordReq = {
    upn: string;
    service: string;
    product: string;
    plan: "Included" | "Quota Pool";
    source: string;
    cny_cost?: Decimal;
    usd_cost?: Decimal;
    detail?: Json;
  };

  type BillingRecordRes = {
    ok?: boolean;
  };

  type ChatPreCheckOneStopReq = {
    /** UPN */
    upn: string;
    /** Domain */
    Dom: string;
    /** 微服务 */
    svc: string;
    /** 产品 */
    product: string;
    /** 动作 */
    action: string;
    /** 配额池 */
    quotaPool: string;
  };

  type ChatPreCheckOneStopRes = {
    ok?: boolean;
  };

  type CheckAndExplainReq = {
    /** 对象 */
    sub: string;
    /** 资源 */
    obj: string;
    /** 动作 */
    act: string;
  };

  type CheckAndExplainRes = {
    allow?: boolean;
    /** 注意只有 allow = true 的时候才会返回 [4]string, 按顺序依次是 sub, dom, obj, act。 */
    reason?: string[];
  };

  type CheckBalanceReq = {
    quotaPool: string;
  };

  type CheckBalanceRes = {
    ok?: boolean;
    percentage?: string;
    nextíResetAt?: string;
  };

  type CheckReq = {
    /** 对象 */
    sub: string;
    /** 资源 */
    obj: string;
    /** 动作 */
    act: string;
  };

  type CheckRes = {
    allow?: boolean;
  };

  type CheckTokensUsageReq = {
    upn: string;
    quotaPool: string;
    nDays: number;
  };

  type CheckTokensUsageRes = {
    tokensUsage?: Json;
  };

  type Decimal = {};

  type DeleteAutoQuotaPoolConfigReq = {};

  type DeleteAutoQuotaPoolConfigRes = {
    /** 是否成功 */
    ok?: boolean;
  };

  type deleteConfigI18nParams = {
    /** 键 */
    key: string;
  };

  type DeleteI18ConfigReq = {
    /** 键 */
    key: string;
  };

  type DeleteI18ConfigRes = {
    /** 是否成功 */
    ok?: boolean;
  };

  type DeleteModelConfigReq = {};

  type DeleteModelConfigRes = {
    /** 配置 */
    config?: string;
  };

  type DeletePoliciesReq = {
    /** Policies */
    policies: string[][];
  };

  type DeletePoliciesRes = {};

  type DeleteQuotaPoolReq = {};

  type DeleteQuotaPoolRes = {
    /** 是否成功 */
    ok?: boolean;
  };

  type EditAutoQuotaPoolConfigReq = {};

  type EditAutoQuotaPoolConfigRes = {
    /** 是否成功 */
    ok?: boolean;
  };

  type EditI18nItemReq = {
    /** 语言 */
    lang: string;
    /** 键 */
    key: string;
    /** 值 */
    value: string;
  };

  type EditI18nItemRes = {
    /** 是否成功 */
    ok?: boolean;
  };

  type EditModelConfigReq = {};

  type EditModelConfigRes = {
    /** 配置 */
    config?: string;
  };

  type EditPolicyReq = {
    /** 旧的 Policy */
    oldPolicy: string[];
    /** 新的 Policy */
    newPolicy: string[];
  };

  type EditPolicyRes = {};

  type EditQuotaPoolReq = {};

  type EditQuotaPoolRes = {
    /** 是否成功 */
    ok?: boolean;
  };

  type ExportBillRecordReq = {
    /** UPN列表 */
    upns?: string[];
    /** 配额池 */
    quotaPools?: string[];
    /** 服务 */
    svc?: string[];
    /** 产品 */
    product?: string[];
    /** 开始时间 */
    startTime: string;
    /** 结束时间 */
    endTime: string;
  };

  type ExportBillRecordRes = {};

  type FilterCondition = {
    /** 字段名 */
    field: string;
    /** 操作符: eq(等于), neq(不等于), gt(大于), gte(大于等于), lt(小于), lte(小于等于), like(模糊匹配), ilike(不区分大小写模糊匹配), in(包含), notin(不包含), contains(包含子串), notcontains(不包含子串), startswith(以...开头), endswith(以...结尾), isnull(为空), isnotnull(不为空) */
    op:
      | "eq"
      | "neq"
      | "gt"
      | "gte"
      | "lt"
      | "lte"
      | "like"
      | "ilike"
      | "in"
      | "notin"
      | "contains"
      | "notcontains"
      | "startswith"
      | "endswith"
      | "isnull"
      | "isnotnull";
    /** 条件值，根据操作符类型可以是字符串、数字、数组等 */
    value?: Var;
  };

  type FilterGroup = {
    /** 逻辑关系: and(且), or(或) */
    logic?: "and" | "or";
    /** 过滤条件列表 */
    conditions?: FilterCondition[];
    /** 嵌套的条件组，支持复杂逻辑 */
    groups?: FilterGroup[];
  };

  type FilterGroupingsReq = {
    /** Upn 列表 */
    users?: string[];
    /** Roles 列表 */
    roles?: string[];
  };

  type FilterGroupingsRes = {
    groups?: string[][];
  };

  type FilterPoliciesReq = {
    /** Subjects 列表 */
    subs?: string[];
    /** Objects 列表 */
    objs?: string[];
    /** Actions 列表 */
    acts?: string[];
  };

  type FilterPoliciesRes = {
    policies?: string[][];
  };

  type FilterReq = {
    /** 过滤条件，支持复杂的逻辑组合查询 */
    filter: FilterGroup;
    /** 排序条件，支持多字段排序 */
    sort?: SortCondition[];
    /** 分页参数，支持分页或查询全部 */
    pagination?: PaginationReq;
    /** 是否返回详细用户信息，false时仅返回UPN列表 */
    verbose?: boolean;
  };

  type FilterRes = {
    /** 用户UPN列表 */
    userUpns?: string[];
    /** 详细用户信息（verbose=true时返回） */
    userInfos?: GetOneRes[];
    /** 总记录数 */
    total?: number;
    /** 当前页码 */
    page?: number;
    /** 每页条数 */
    pageSize?: number;
    /** 总页数 */
    totalPages?: number;
    /** 是否为全部数据查询 */
    isAll?: boolean;
  };

  type GetAllActionsReq = {};

  type GetAllActionsRes = {
    /** Actions */
    actions?: string[];
  };

  type GetAllDomainsReq = {};

  type GetAllDomainsRes = {
    /** Domains */
    domains?: string[];
  };

  type GetAllLangsReq = {};

  type GetAllLangsRes = {
    /** 语言列表 */
    langs?: string[];
  };

  type GetAllObjectsReq = {};

  type GetAllObjectsRes = {
    /** Objects */
    objects?: string[];
  };

  type GetAllQuotaPoolsReq = {
    /** Upn */
    upn: string;
  };

  type GetAllQuotaPoolsRes = {
    /** QuotaPools 列表。 */
    quotaPools?: string[];
  };

  type GetAllRolesReq = {};

  type GetAllRolesRes = {
    /** Roles */
    roles?: string[];
  };

  type GetAllSubjectsReq = {};

  type GetAllSubjectsRes = {
    /** Subjects */
    subjects?: string[];
  };

  type GetAllUsersForQuotaPoolReq = {
    /** QuotaPool */
    quotaPool: string;
  };

  type GetAllUsersForQuotaPoolRes = {
    /** Users 列表 */
    users?: string[];
  };

  type getAuthChatQuotaPoolsModelsParams = {
    /** QuotaPool */
    quotaPool: string;
  };

  type getAuthQuotaPoolsAllParams = {
    /** Upn */
    upn: string;
  };

  type getAuthQuotaPoolsUsersParams = {
    /** QuotaPool */
    quotaPool: string;
  };

  type GetAutoQuotaPoolConfigReq = {};

  type GetAutoQuotaPoolConfigRes = {
    /** 自动配额池规则 */
    items?: AutoQuotaPoolItem[];
  };

  type AutoQuotaPoolItem = {
    /** 自增主键 */
    id?: number;
    /** 规则名称，唯一 */
    ruleName?: string;
    /** 规则说明 */
    description?: string;
    /** 刷新周期 */
    cronCycle?: string;
    /** 定期配额 */
    regularQuota?: number;
    /** 是否启用该规则 */
    enabled?: boolean;
    /** 过滤条件组 */
    filterGroup?: any;
    /** UPN缓存列表 */
    upnsCache?: any;
    /** 优先级，数值越小优先匹配 */
    priority?: number;
    /** 该规则上次评估时间 */
    lastEvaluatedAt?: string;
    /** 创建时间 */
    createdAt?: string;
    /** 更新时间 */
    updatedAt?: string;
  };

  type AddAutoQuotaPoolConfigReq = {
    /** 规则名称（唯一） */
    ruleName: string;
    /** 刷新周期，Cron 表达式 */
    cronCycle: string;
    /** 定期配额（每周期重置） */
    regularQuota: number;
    /** 是否启用该规则 */
    enabled?: boolean;
    /** 过滤条件组，满足条件的用户将应用该规则 */
    filterGroup?: any;
    /** 规则说明 */
    description?: string;
    /** 优先级，数值越小优先匹配 */
    priority?: number;
  };

  type AddAutoQuotaPoolConfigRes = {
    /** 是否成功 */
    ok?: boolean;
  };

  type EditAutoQuotaPoolConfigReq = {
    /** 规则名称（唯一） */
    ruleName: string;
    /** 刷新周期，Cron 表达式 */
    cronCycle?: string;
    /** 定期配额（每周期重置） */
    regularQuota?: number;
    /** 是否启用该配额池 */
    enabled?: boolean;
    /** 过滤条件组，满足条件的用户将应用该规则 */
    filterGroup?: any;
    /** 规则说明 */
    description?: string;
    /** 优先级，数值越小优先匹配 */
    priority?: number;
  };

  type EditAutoQuotaPoolConfigRes = {
    /** 是否成功 */
    ok?: boolean;
  };

  type DeleteAutoQuotaPoolConfigReq = {
    /** 规则名称（唯一） */
    ruleName: string;
  };

  type DeleteAutoQuotaPoolConfigRes = {
    /** 是否成功 */
    ok?: boolean;
  };

  type getAvailableModelForQuotaPoolReq = {
    /** QuotaPool */
    quotaPool: string;
  };

  type GetAvailableModelForQuotaPoolRes = {
    /** AvailableModel 列表 */
    availableModels?: string[];
  };

  type getBillingStatsChatUsageChartParams = {
    /** N Days */
    N?: number;
  };

  type getBillingStatsChatUsageGroupParams = {
    /** N Days */
    N?: number;
  };

  type GetBillRecordReq = {
    /** UPN列表 */
    upns?: string[];
    /** 配额池 */
    quotaPools?: string[];
    /** 服务 */
    svc?: string[];
    /** 产品 */
    product?: string[];
    /** 开始时间 */
    startTime: string;
    /** 结束时间 */
    endTime: string;
  };

  type GetBillRecordRes = {
    records?: Json;
  };

  type getConfigI18nLangParams = {
    /** 语言 */
    lang: string;
  };

  type GetI18nConfigReq = {
    /** 语言 */
    lang: string;
  };

  type GetI18nConfigRes = {
    Config?: Json;
  };

  type GetModelConfigReq = {};

  type ModelConfigItem = {
    /** 模型名称 */
    approachName?: string;
    /** 定价配置（JSON） */
    pricing?: any;
    /** 折扣 */
    discount?: number;
    /** 客户端类型 */
    clientType?: string;
    /** 客户端参数（JSON） */
    clientArgs?: any;
    /** 请求参数（JSON） */
    requestArgs?: any;
    /** 服务项标识 */
    servicewares?: string[];
    /** 创建时间 */
    createdAt?: string;
    /** 更新时间 */
    updatedAt?: string;
  };

  type GetModelConfigRes = {
    /** 模型配置列表 */
    items: ModelConfigItem[];
  };

  type GetOneReq = {
    /** UPN */
    upn: string;
  };

  type GetOneRes = {
    /** UPN - 唯一。用户名@cuhk.edu.cn 或 学号@link.cuhk.edu.cn。用户登录名。 */
    upn?: string;
    /** 邮箱 - 唯一。用户名@cuhk.edu.cn。 */
    email?: string;
    /** 显示名 - 显示名。 */
    displayName?: string;
    /** 在校状态 - 当前在校状态：Employed | Dimission | In-School | Graduation | Withdraw | Emeritus. （在岗 | 离职 | 在校 | 毕业 | 退学 | 荣誉退休。） */
    schoolStatus?: string;
    /** 身份 - 身份类型：Fulltime | CO | Student | Parttime。（全职 | 附属单位 | 学生 | 兼职。） */
    identityType?: string;
    /** 员工/学号 - 唯一。6位员工编号或9/10位学号。 */
    employeeId?: string;
    /** 全名 - 唯一。全名。 */
    name?: string;
    /** 标签 - 用户标签。 */
    tags?: string[];
    /** 部门 - 部门信息。 */
    department?: string;
    /** 职务 - 职务名称。 */
    title?: string;
    /** 办公室 - 办公地点。 */
    office?: string;
    /** 办公电话 - 办公室电话。 */
    officePhone?: string;
    /** 员工类型 - 员工类型。 */
    employeeType?: string;
    /** 经费类型/入学年份 - 教职员经费类型（uni/researchPro/Other）或学生4位入学年份 */
    fundingTypeOrAdmissionYear?: string;
    /** 学历大类 - Postgraduate/Undergraduate 研究生/本科生 */
    studentCategoryPrimary?: string;
    /** 学历细类 - Master/Ph.D./Undergraduate 硕士/博士/本科 */
    studentCategoryDetail?: string;
    /** 学生类别 - Local/Exchange/International/CUCDMP/HMT 本地/交换/国际/本部/港澳台 */
    studentNationalityType?: string;
    /** 书院 - 书院缩写（如SHAW） */
    residentialCollege?: string;
    /** 教职员角色 - Teaching/Admin/VisitingStudent/Alumni/Other 教学/行政/访问学生/校友/其他 */
    staffRole?: string;
    /** SAM账户名 - Windows账户名。 */
    samAccountName?: string;
    /** 邮件别名 - 邮箱别名。 */
    mailNickname?: string;
    /** 创建时间 - 记录创建时间。 */
    createdAt?: string;
    /** 更新时间 - 记录最后更新时间。 */
    updatedAt?: string;
  };

  type GetQuotaPoolReq = {};

  type GetQuotaPoolRes = {
    /** 配额池 */
    quotaPool?: string;
  };

  type getUserinfosParams = {
    /** UPN */
    upn: string;
  };

  type HelloReq = {};

  type HelloRes = {};

  type Json = {};

  type NDaysProductUsageChartReq = {
    /** N Days */
    N?: number;
  };

  type NDaysProductUsageChartRes = {
    chartData?: Json;
  };

  type NDaysProductUsageGroupReq = {
    /** N Days */
    N?: number;
  };

  type NDaysProductUsageGroupRes = {
    groupData?: Json;
  };

  type NewQuotaPoolReq = {};

  type NewQuotaPoolRes = {
    /** 是否成功 */
    ok?: boolean;
  };

  type PaginationReq = {
    /** 页码，从1开始 */
    page?: number;
    /** 每页条数，最大1000 */
    pageSize?: number;
    /** 是否返回全部数据，true时忽略分页参数，但仍有最大限制保护 */
    all?: boolean;
  };

  type ResetBalanceReq = {
    /** 配额池 */
    quotaPool: string;
  };

  type ResetBalanceRes = {
    /** 是否成功 */
    ok?: boolean;
    /** 错误信息 */
    err?: string;
  };

  type SortCondition = {
    /** 排序字段 */
    field: string;
    /** 排序方向: asc(升序), desc(降序) */
    order?: "asc" | "desc";
  };

  type Var = {};
}
