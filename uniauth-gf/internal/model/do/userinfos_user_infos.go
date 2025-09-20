// =================================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT. Created at 2025-09-20 21:36:19
// =================================================================================

package do

import (
	"github.com/gogf/gf/v2/frame/g"
	"github.com/gogf/gf/v2/os/gtime"
)

// UserinfosUserInfos is the golang structure of table userinfos_user_infos for DAO operations like Where/Data.
type UserinfosUserInfos struct {
	g.Meta                     `orm:"table:userinfos_user_infos, do:true"`
	Upn                        any         // UPN - 唯一。用户名@cuhk.edu.cn 或 学号@link.cuhk.edu.cn。用户登录名。
	Email                      any         // 邮箱 - 唯一。用户名@cuhk.edu.cn。
	DisplayName                any         // 显示名 - 显示名。
	SchoolStatus               any         // 在校状态 - 当前在校状态：Employed | Dimission | In-School | Graduation | Withdraw | Emeritus. （在岗 | 离职 | 在校 | 毕业 | 退学 | 荣誉退休。）
	IdentityType               any         // 身份 - 身份类型：Fulltime | CO | Student | Parttime。（全职 | 附属单位 | 学生 | 兼职。）
	EmployeeId                 any         // 员工/学号 - 唯一。6位员工编号或9/10位学号。
	Name                       any         // 全名 - 唯一。全名。
	Tags                       []string    // 标签 - 用户标签。
	Department                 any         // 部门 - 部门信息。
	Title                      any         // 职务 - 职务名称。
	Office                     any         // 办公室 - 办公地点。
	OfficePhone                any         // 办公电话 - 办公室电话。
	EmployeeType               any         // 员工类型 - 员工类型。
	FundingTypeOrAdmissionYear any         // 经费类型/入学年份 - 教职员经费类型（uni/researchPro/Other）或学生4位入学年份
	StudentCategoryPrimary     any         // 学历大类 - Postgraduate/Undergraduate 研究生/本科生
	StudentCategoryDetail      any         // 学历细类 - Master/Ph.D./Undergraduate 硕士/博士/本科
	StudentNationalityType     any         // 学生类别 - Local/Exchange/International/CUCDMP/HMT 本地/交换/国际/本部/港澳台
	ResidentialCollege         any         // 书院 - 书院缩写（如SHAW）
	StaffRole                  any         // 教职员角色 - Teaching/Admin/VisitingStudent/Alumni/Other 教学/行政/访问学生/校友/其他
	SamAccountName             any         // SAM账户名 - Windows账户名。
	MailNickname               any         // 邮件别名 - 邮箱别名。
	CreatedAt                  *gtime.Time // 创建时间 - 记录创建时间。
	UpdatedAt                  *gtime.Time // 更新时间 - 记录最后更新时间。
}
