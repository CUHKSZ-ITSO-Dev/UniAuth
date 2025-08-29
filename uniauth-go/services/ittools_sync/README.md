## ittools_sync

同步从 ITTools API 获取的 AD 用户数据到 PostgreSQL， 数据表 user_infos 。本脚本默认并行执行所有已配置的同步目标。

### 环境变量一览

- **USER_QUERY_URL**: ITTools 用户查询接口地址（必需）
- **QUERY_API_KEYS**: ITTools API Key 列表，JSON 字符串（必需）。示例：`["key1","key2"]`
- **ENCRYPT_PASSWORD**: ITTools 接口使用的加密口令（必需）

- **PGHOST**: PostgreSQL 主机（必需）
- **PGPORT**: PostgreSQL 端口（可选，默认 `5432`）
- **PGUSER**: PostgreSQL 用户名（必需）
- **PGPASSWORD**: PostgreSQL 密码（必需）
- **PGNAME**: PostgreSQL 数据库名（必需）

说明：
- `QUERY_API_KEYS` 需为 JSON 数组字符串格式。

### 字段映射（参考）

源数据 → 目标表 `user_infos`（PostgreSQL: `TEXT[]` 用于 `tags`；）
- **upn** ← `userPrincipalName`（主键）
- **email** ← `mail`
- **display_name** ← `displayName`
- **unique_name** ← `name`
- **sam_account_name** ← `samaccountname`
- **school_status** ← `extensionattribute5`
- **identity_type** ← `extensionattribute7`
- **employee_id** ← `EmployeeID`
- **name** ← `name`
- **department** ← `department`
- **title** ← `title`
- **office** ← `office`
- **office_phone** ← `officephone`
- **employee_type** ← `employeeType`
- **funding_type_or_admission_year** ← `extensionattribute1`
- **student_category_primary** ← `extensionattribute2`
- **student_category_detail** ← `extensionattribute3`
- **student_nationality_type** ← `extensionattribute4`
- **residential_college** ← `extensionattribute6`
- **staff_role** ← `extensionattribute10`
- **mail_nickname** ← `mailnickname`
- **tags** ← 从 `memberof` 正则提取 `CN=([^,]+)` 的列表
- **created_at/updated_at** ← 运行时写入（Asia/Shanghai）