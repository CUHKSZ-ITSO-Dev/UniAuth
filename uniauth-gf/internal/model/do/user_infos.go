// =================================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT.
// =================================================================================

package do

import (
	"github.com/gogf/gf/v2/frame/g"
	"github.com/gogf/gf/v2/os/gtime"
)

// UserInfos is the golang structure of table user_infos for DAO operations like Where/Data.
type UserInfos struct {
	g.Meta                     `orm:"table:user_infos, do:true"`
	Upn                        interface{} // UPN - 唯一。用户名@cuhk.edu.cn 或 学号@link.cuhk.edu.cn。用户登录名。
	Email                      interface{} // 邮箱 - 唯一。用户名@cuhk.edu.cn。
	DisplayName                interface{} // 显示名 - 显示名。
	SchoolStatus               interface{} // 在校状态 - 当前在校状态：Employed | Dimission | In-School | Graduation | Withdraw | Emeritus. （在岗 | 离职 | 在校 | 毕业 | 退学 | 荣誉退休。）
	IdentityType               interface{} // 身份 - 身份类型：Fulltime | CO | Student | Parttime。（全职 | 附属单位 | 学生 | 兼职。）
	EmployeeId                 interface{} // 员工/学号 - 唯一。6位员工编号或9/10位学号。
	Name                       interface{} // 全名 - 唯一。全名。
	Tags                       []string    // 标签 - 用户标签。
	Department                 interface{} // 部门 - 部门信息。
	Title                      interface{} // 职务 - 职务名称。
	Office                     interface{} // 办公室 - 办公地点。
	OfficePhone                interface{} // 办公电话 - 办公室电话。
	EmployeeType               interface{} // 员工类型 - 员工类型。
	FundingTypeOrAdmissionYear interface{} // 经费类型/入学年份 - 教职员经费类型（uni/researchPro/Other）或学生4位入学年份
	StudentCategoryPrimary     interface{} // 学历大类 - Postgraduate/Undergraduate 研究生/本科生
	StudentCategoryDetail      interface{} // 学历细类 - Master/Ph.D./Undergraduate 硕士/博士/本科
	StudentNationalityType     interface{} // 学生类别 - Local/Exchange/International/CUCDMP/HMT 本地/交换/国际/本部/港澳台
	ResidentialCollege         interface{} // 书院 - 书院缩写（如SHAW）
	StaffRole                  interface{} // 教职员角色 - Teaching/Admin/VisitingStudent/Alumni/Other 教学/行政/访问学生/校友/其他
	SamAccountName             interface{} // SAM账户名 - Windows账户名。
	MailNickname               interface{} // 邮件别名 - 邮箱别名。
	CreatedAt                  *gtime.Time // 创建时间 - 记录创建时间。
	UpdatedAt                  *gtime.Time // 更新时间 - 记录最后更新时间。
}
