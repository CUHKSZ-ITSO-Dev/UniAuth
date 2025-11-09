package tools

import (
	"context"

	"github.com/gogf/gf/v2/frame/g"
	"github.com/mark3labs/mcp-go/mcp"
	"github.com/mark3labs/mcp-go/server"
)

func RegisterDangerSql(s *server.MCPServer) error {
	tool := mcp.NewTool("get_arbitrary_billing_records_with_sql",
		mcp.WithDescription("查询任意账单记录，支持SQL语句。数据库为 Postgres SQL 17。"),
		mcp.WithString("sql",
			mcp.Required(),
			mcp.Description("The arithmetic SQL to perform。 Here is the table structure:"+
				`
CREATE TABLE billing_cost_records (
    id BIGSERIAL PRIMARY KEY,
    upn VARCHAR(255) NOT NULL,
    svc VARCHAR(255) NOT NULL,
    product VARCHAR(255) NOT NULL,
    cost NUMERIC(25, 10) NOT NULL,
    original_cost NUMERIC(25, 10) NOT NULL,
    plan VARCHAR(255) NOT NULL,
    source VARCHAR(255) NOT NULL,
    remark JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_billing_cost_records_upn ON billing_cost_records(upn);
CREATE INDEX idx_billing_cost_records_svc ON billing_cost_records(svc);
CREATE INDEX idx_billing_cost_records_svc_and_product ON billing_cost_records(svc, product);
CREATE INDEX idx_billing_cost_records_source ON billing_cost_records(source);
CREATE INDEX idx_billing_cost_records_created_at ON billing_cost_records(created_at);

COMMENT ON COLUMN billing_cost_records.id IS '自增主键';
COMMENT ON COLUMN billing_cost_records.upn IS 'UPN';
COMMENT ON COLUMN billing_cost_records.svc IS '服务名称';
COMMENT ON COLUMN billing_cost_records.product IS '产品名称';
COMMENT ON COLUMN billing_cost_records.cost IS '费用';
COMMENT ON COLUMN billing_cost_records.original_cost IS '原始费用';
COMMENT ON COLUMN billing_cost_records.plan IS '计费方案';
COMMENT ON COLUMN billing_cost_records.source IS '来源';
COMMENT ON COLUMN billing_cost_records.remark IS '备注信息';
COMMENT ON COLUMN billing_cost_records.created_at IS '创建时间';

---

CREATE TABLE userinfos_user_infos (
    upn VARCHAR(255) PRIMARY KEY,
    email VARCHAR(255),
    display_name VARCHAR(255),
    school_status VARCHAR(255),
    identity_type VARCHAR(255),
    employee_id VARCHAR(255),
    name VARCHAR(255),
    tags TEXT[],
    department VARCHAR(255),
    title VARCHAR(255),
    office VARCHAR(255),
    office_phone VARCHAR(255),
    employee_type VARCHAR(255),
    funding_type_or_admission_year VARCHAR(255),
    student_category_primary VARCHAR(255),
    student_category_detail VARCHAR(255),
    student_nationality_type VARCHAR(255),
    residential_college VARCHAR(255),
    staff_role VARCHAR(255),
    sam_account_name VARCHAR(255),
    mail_nickname VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引以提高查询性能
CREATE INDEX idx_userinfos_user_infos_email ON userinfos_user_infos(email);
CREATE INDEX idx_userinfos_user_infos_employee_id ON userinfos_user_infos(employee_id);
CREATE INDEX idx_userinfos_user_infos_name ON userinfos_user_infos(name);
CREATE INDEX idx_userinfos_user_infos_department ON userinfos_user_infos(department);
CREATE INDEX idx_userinfos_user_infos_tags ON userinfos_user_infos USING GIN(tags);

-- 添加中文注释
COMMENT ON TABLE userinfos_user_infos IS 'AD域信息';
COMMENT ON COLUMN userinfos_user_infos.upn IS 'UPN - 唯一。用户名@cuhk.edu.cn 或 学号@link.cuhk.edu.cn。用户登录名。';
COMMENT ON COLUMN userinfos_user_infos.email IS '邮箱 - 唯一。用户名@cuhk.edu.cn。';
COMMENT ON COLUMN userinfos_user_infos.display_name IS '显示名 - 显示名。';
COMMENT ON COLUMN userinfos_user_infos.school_status IS '在校状态 - 当前在校状态：Employed | Dimission | In-School | Graduation | Withdraw | Emeritus. （在岗 | 离职 | 在校 | 毕业 | 退学 | 荣誉退休。）';
COMMENT ON COLUMN userinfos_user_infos.identity_type IS '身份 - 身份类型：Fulltime | CO | Student | Parttime。（全职 | 附属单位 | 学生 | 兼职。）';
COMMENT ON COLUMN userinfos_user_infos.employee_id IS '员工/学号 - 唯一。6位员工编号或9/10位学号。';
COMMENT ON COLUMN userinfos_user_infos.name IS '全名 - 唯一。全名。';
COMMENT ON COLUMN userinfos_user_infos.tags IS '标签 - 用户标签。';
COMMENT ON COLUMN userinfos_user_infos.department IS '部门 - 部门信息。';
COMMENT ON COLUMN userinfos_user_infos.title IS '职务 - 职务名称。';
COMMENT ON COLUMN userinfos_user_infos.office IS '办公室 - 办公地点。';
COMMENT ON COLUMN userinfos_user_infos.office_phone IS '办公电话 - 办公室电话。';
COMMENT ON COLUMN userinfos_user_infos.employee_type IS '员工类型 - 员工类型。';
COMMENT ON COLUMN userinfos_user_infos.funding_type_or_admission_year IS '经费类型/入学年份 - 教职员经费类型（uni/researchPro/Other）或学生4位入学年份';
COMMENT ON COLUMN userinfos_user_infos.student_category_primary IS '学历大类 - Postgraduate/Undergraduate 研究生/本科生';
COMMENT ON COLUMN userinfos_user_infos.student_category_detail IS '学历细类 - Master/Ph.D./Undergraduate 硕士/博士/本科';
COMMENT ON COLUMN userinfos_user_infos.student_nationality_type IS '学生类别 - Local/Exchange/International/CUCDMP/HMT 本地/交换/国际/本部/港澳台';
COMMENT ON COLUMN userinfos_user_infos.residential_college IS '书院 - 书院缩写（如SHAW）';
COMMENT ON COLUMN userinfos_user_infos.staff_role IS '教职员角色 - Teaching/Admin/VisitingStudent/Alumni/Other 教学/行政/访问学生/校友/其他';
COMMENT ON COLUMN userinfos_user_infos.sam_account_name IS 'SAM账户名 - Windows账户名。';
COMMENT ON COLUMN userinfos_user_infos.mail_nickname IS '邮件别名 - 邮箱别名。';
COMMENT ON COLUMN userinfos_user_infos.created_at IS '创建时间 - 记录创建时间。';
COMMENT ON COLUMN userinfos_user_infos.updated_at IS '更新时间 - 记录最后更新时间。';
`),
		),
	)

	s.AddTool(tool, func(ctx context.Context, request mcp.CallToolRequest) (*mcp.CallToolResult, error) {
		sql := request.GetString("sql", "")
		records, err := g.DB("readonly").GetAll(ctx, sql)
		if err != nil {
			return mcp.NewToolResultError(err.Error()), nil
		}
		return mcp.NewToolResultText(records.Json()), nil
	})
	return nil
}
