// ==========================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT. Created at 2025-09-17 16:51:00
// ==========================================================================

package internal

import (
	"context"

	"github.com/gogf/gf/v2/database/gdb"
	"github.com/gogf/gf/v2/frame/g"
)

// UserinfosUserInfosDao is the data access object for the table userinfos_user_infos.
type UserinfosUserInfosDao struct {
	table    string                    // table is the underlying table name of the DAO.
	group    string                    // group is the database configuration group name of the current DAO.
	columns  UserinfosUserInfosColumns // columns contains all the column names of Table for convenient usage.
	handlers []gdb.ModelHandler        // handlers for customized model modification.
}

// UserinfosUserInfosColumns defines and stores column names for the table userinfos_user_infos.
type UserinfosUserInfosColumns struct {
	Upn                        string // UPN - 唯一。用户名@cuhk.edu.cn 或 学号@link.cuhk.edu.cn。用户登录名。
	Email                      string // 邮箱 - 唯一。用户名@cuhk.edu.cn。
	DisplayName                string // 显示名 - 显示名。
	SchoolStatus               string // 在校状态 - 当前在校状态：Employed | Dimission | In-School | Graduation | Withdraw | Emeritus. （在岗 | 离职 | 在校 | 毕业 | 退学 | 荣誉退休。）
	IdentityType               string // 身份 - 身份类型：Fulltime | CO | Student | Parttime。（全职 | 附属单位 | 学生 | 兼职。）
	EmployeeId                 string // 员工/学号 - 唯一。6位员工编号或9/10位学号。
	Name                       string // 全名 - 唯一。全名。
	Tags                       string // 标签 - 用户标签。
	Department                 string // 部门 - 部门信息。
	Title                      string // 职务 - 职务名称。
	Office                     string // 办公室 - 办公地点。
	OfficePhone                string // 办公电话 - 办公室电话。
	EmployeeType               string // 员工类型 - 员工类型。
	FundingTypeOrAdmissionYear string // 经费类型/入学年份 - 教职员经费类型（uni/researchPro/Other）或学生4位入学年份
	StudentCategoryPrimary     string // 学历大类 - Postgraduate/Undergraduate 研究生/本科生
	StudentCategoryDetail      string // 学历细类 - Master/Ph.D./Undergraduate 硕士/博士/本科
	StudentNationalityType     string // 学生类别 - Local/Exchange/International/CUCDMP/HMT 本地/交换/国际/本部/港澳台
	ResidentialCollege         string // 书院 - 书院缩写（如SHAW）
	StaffRole                  string // 教职员角色 - Teaching/Admin/VisitingStudent/Alumni/Other 教学/行政/访问学生/校友/其他
	SamAccountName             string // SAM账户名 - Windows账户名。
	MailNickname               string // 邮件别名 - 邮箱别名。
	CreatedAt                  string // 创建时间 - 记录创建时间。
	UpdatedAt                  string // 更新时间 - 记录最后更新时间。
}

// userinfosUserInfosColumns holds the columns for the table userinfos_user_infos.
var userinfosUserInfosColumns = UserinfosUserInfosColumns{
	Upn:                        "upn",
	Email:                      "email",
	DisplayName:                "display_name",
	SchoolStatus:               "school_status",
	IdentityType:               "identity_type",
	EmployeeId:                 "employee_id",
	Name:                       "name",
	Tags:                       "tags",
	Department:                 "department",
	Title:                      "title",
	Office:                     "office",
	OfficePhone:                "office_phone",
	EmployeeType:               "employee_type",
	FundingTypeOrAdmissionYear: "funding_type_or_admission_year",
	StudentCategoryPrimary:     "student_category_primary",
	StudentCategoryDetail:      "student_category_detail",
	StudentNationalityType:     "student_nationality_type",
	ResidentialCollege:         "residential_college",
	StaffRole:                  "staff_role",
	SamAccountName:             "sam_account_name",
	MailNickname:               "mail_nickname",
	CreatedAt:                  "created_at",
	UpdatedAt:                  "updated_at",
}

// NewUserinfosUserInfosDao creates and returns a new DAO object for table data access.
func NewUserinfosUserInfosDao(handlers ...gdb.ModelHandler) *UserinfosUserInfosDao {
	return &UserinfosUserInfosDao{
		group:    "default",
		table:    "userinfos_user_infos",
		columns:  userinfosUserInfosColumns,
		handlers: handlers,
	}
}

// DB retrieves and returns the underlying raw database management object of the current DAO.
func (dao *UserinfosUserInfosDao) DB() gdb.DB {
	return g.DB(dao.group)
}

// Table returns the table name of the current DAO.
func (dao *UserinfosUserInfosDao) Table() string {
	return dao.table
}

// Columns returns all column names of the current DAO.
func (dao *UserinfosUserInfosDao) Columns() UserinfosUserInfosColumns {
	return dao.columns
}

// Group returns the database configuration group name of the current DAO.
func (dao *UserinfosUserInfosDao) Group() string {
	return dao.group
}

// Ctx creates and returns a Model for the current DAO. It automatically sets the context for the current operation.
func (dao *UserinfosUserInfosDao) Ctx(ctx context.Context) *gdb.Model {
	model := dao.DB().Model(dao.table)
	for _, handler := range dao.handlers {
		model = handler(model)
	}
	return model.Safe().Ctx(ctx)
}

// Transaction wraps the transaction logic using function f.
// It rolls back the transaction and returns the error if function f returns a non-nil error.
// It commits the transaction and returns nil if function f returns nil.
//
// Note: Do not commit or roll back the transaction in function f,
// as it is automatically handled by this function.
func (dao *UserinfosUserInfosDao) Transaction(ctx context.Context, f func(ctx context.Context, tx gdb.TX) error) (err error) {
	return dao.Ctx(ctx).Transaction(ctx, f)
}
