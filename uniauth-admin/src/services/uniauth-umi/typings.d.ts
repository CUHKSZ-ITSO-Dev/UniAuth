declare namespace API {
  type AddPolicyReq = {
    /** Subject */
    sub: string;
    /** Domain */
    dom: string;
    /** Object */
    obj: string;
    /** Action */
    act: string;
  };

  type AddPolicyRes = {};

  type CheckAndExplainReq = {
    /** 对象 */
    sub: string;
    /** 域 */
    dom: string;
    /** 资源 */
    obj: string;
    /** 动作 */
    act: string;
  };

  type CheckAndExplainRes = {
    allow?: boolean;
    /** 返回 [4]string, 按顺序依次是 sub, dom, obj, act。 */
    reason?: string[];
  };

  type CheckReq = {
    /** 对象 */
    sub: string;
    /** 域 */
    dom: string;
    /** 资源 */
    obj: string;
    /** 动作 */
    act: string;
  };

  type CheckRes = {
    allow?: boolean;
  };

  type DeletePolicyReq = {
    /** Subject */
    sub: string;
    /** Domain */
    dom: string;
    /** Object */
    obj: string;
    /** Action */
    act: string;
  };

  type DeletePolicyRes = {};

  type EditPolicyReq = {
    /** 旧的 Policy */
    oldPolicy: string[];
    /** 新的 Policy */
    newPolicy: string[];
  };

  type EditPolicyRes = {};

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
    /** Users 列表 */
    users?: string[];
    /** Roles 列表 */
    roles?: string[];
    /** Domains 列表 */
    domains?: string[];
  };

  type FilterGroupingsRes = {
    groups?: string[][];
  };

  type FilterPoliciesReq = {
    /** Subjects 列表 */
    subs?: string[];
    /** Domains 列表 */
    doms?: string[];
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

  type GetAllObjectsReq = {};

  type GetAllObjectsRes = {
    /** Objects */
    objects?: string[];
  };

  type GetAllSubjectsReq = {};

  type GetAllSubjectsRes = {
    /** Subjects */
    subjects?: string[];
  };

  type GetOneReq = {
    /** UPN */
    upn: string;
  };

  type GetOneRes = {
    upn?: string;
    displayName?: string;
    uniqueName?: string;
    samAccountName?: string;
    email?: string;
    schoolStatus?: string;
    identityType?: string;
    employeeId?: string;
    name?: string;
    department?: string;
    title?: string;
    office?: string;
    officePhone?: string;
    employeeType?: string;
    fundingTypeOrAdmissionYear?: string;
    studentCategoryPrimary?: string;
    studentCategoryDetail?: string;
    studentNationalityType?: string;
    residentialCollege?: string;
    staffRole?: string;
    mailNickname?: string;
    tags?: string[];
    createdAt?: string;
    updatedAt?: string;
  };

  type getUsersUserinfoUpnParams = {
    /** UPN */
    upn: string;
  };

  type HelloReq = {};

  type HelloRes = {};

  type PaginationReq = {
    /** 页码，从1开始 */
    page?: number;
    /** 每页条数，最大1000 */
    pageSize?: number;
    /** 是否返回全部数据，true时忽略分页参数，但仍有最大限制保护 */
    all?: boolean;
  };

  type SortCondition = {
    /** 排序字段 */
    field: string;
    /** 排序方向: asc(升序), desc(降序) */
    order?: "asc" | "desc";
  };

  type Var = {};
}
