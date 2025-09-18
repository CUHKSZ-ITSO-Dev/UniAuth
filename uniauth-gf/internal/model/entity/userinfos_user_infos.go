// =================================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT. Created at 2025-09-17 23:54:41
// =================================================================================

package entity

import (
	"github.com/gogf/gf/v2/os/gtime"
)

// UserinfosUserInfos is the golang structure for table userinfos_user_infos.
type UserinfosUserInfos struct {
	Upn                        string      `json:"upn"                        orm:"upn"                            description:"UPN - 唯一。用户名@cuhk.edu.cn 或 学号@link.cuhk.edu.cn。用户登录名。"`                                                               // UPN - 唯一。用户名@cuhk.edu.cn 或 学号@link.cuhk.edu.cn。用户登录名。
	Email                      string      `json:"email"                      orm:"email"                          description:"邮箱 - 唯一。用户名@cuhk.edu.cn。"`                                                                                            // 邮箱 - 唯一。用户名@cuhk.edu.cn。
	DisplayName                string      `json:"displayName"                orm:"display_name"                   description:"显示名 - 显示名。"`                                                                                                          // 显示名 - 显示名。
	SchoolStatus               string      `json:"schoolStatus"               orm:"school_status"                  description:"在校状态 - 当前在校状态：Employed | Dimission | In-School | Graduation | Withdraw | Emeritus. （在岗 | 离职 | 在校 | 毕业 | 退学 | 荣誉退休。）"` // 在校状态 - 当前在校状态：Employed | Dimission | In-School | Graduation | Withdraw | Emeritus. （在岗 | 离职 | 在校 | 毕业 | 退学 | 荣誉退休。）
	IdentityType               string      `json:"identityType"               orm:"identity_type"                  description:"身份 - 身份类型：Fulltime | CO | Student | Parttime。（全职 | 附属单位 | 学生 | 兼职。）"`                                                 // 身份 - 身份类型：Fulltime | CO | Student | Parttime。（全职 | 附属单位 | 学生 | 兼职。）
	EmployeeId                 string      `json:"employeeId"                 orm:"employee_id"                    description:"员工/学号 - 唯一。6位员工编号或9/10位学号。"`                                                                                          // 员工/学号 - 唯一。6位员工编号或9/10位学号。
	Name                       string      `json:"name"                       orm:"name"                           description:"全名 - 唯一。全名。"`                                                                                                         // 全名 - 唯一。全名。
	Tags                       []string    `json:"tags"                       orm:"tags"                           description:"标签 - 用户标签。"`                                                                                                          // 标签 - 用户标签。
	Department                 string      `json:"department"                 orm:"department"                     description:"部门 - 部门信息。"`                                                                                                          // 部门 - 部门信息。
	Title                      string      `json:"title"                      orm:"title"                          description:"职务 - 职务名称。"`                                                                                                          // 职务 - 职务名称。
	Office                     string      `json:"office"                     orm:"office"                         description:"办公室 - 办公地点。"`                                                                                                         // 办公室 - 办公地点。
	OfficePhone                string      `json:"officePhone"                orm:"office_phone"                   description:"办公电话 - 办公室电话。"`                                                                                                       // 办公电话 - 办公室电话。
	EmployeeType               string      `json:"employeeType"               orm:"employee_type"                  description:"员工类型 - 员工类型。"`                                                                                                        // 员工类型 - 员工类型。
	FundingTypeOrAdmissionYear string      `json:"fundingTypeOrAdmissionYear" orm:"funding_type_or_admission_year" description:"经费类型/入学年份 - 教职员经费类型（uni/researchPro/Other）或学生4位入学年份"`                                                                 // 经费类型/入学年份 - 教职员经费类型（uni/researchPro/Other）或学生4位入学年份
	StudentCategoryPrimary     string      `json:"studentCategoryPrimary"     orm:"student_category_primary"       description:"学历大类 - Postgraduate/Undergraduate 研究生/本科生"`                                                                           // 学历大类 - Postgraduate/Undergraduate 研究生/本科生
	StudentCategoryDetail      string      `json:"studentCategoryDetail"      orm:"student_category_detail"        description:"学历细类 - Master/Ph.D./Undergraduate 硕士/博士/本科"`                                                                          // 学历细类 - Master/Ph.D./Undergraduate 硕士/博士/本科
	StudentNationalityType     string      `json:"studentNationalityType"     orm:"student_nationality_type"       description:"学生类别 - Local/Exchange/International/CUCDMP/HMT 本地/交换/国际/本部/港澳台"`                                                      // 学生类别 - Local/Exchange/International/CUCDMP/HMT 本地/交换/国际/本部/港澳台
	ResidentialCollege         string      `json:"residentialCollege"         orm:"residential_college"            description:"书院 - 书院缩写（如SHAW）"`                                                                                                    // 书院 - 书院缩写（如SHAW）
	StaffRole                  string      `json:"staffRole"                  orm:"staff_role"                     description:"教职员角色 - Teaching/Admin/VisitingStudent/Alumni/Other 教学/行政/访问学生/校友/其他"`                                                // 教职员角色 - Teaching/Admin/VisitingStudent/Alumni/Other 教学/行政/访问学生/校友/其他
	SamAccountName             string      `json:"samAccountName"             orm:"sam_account_name"               description:"SAM账户名 - Windows账户名。"`                                                                                                // SAM账户名 - Windows账户名。
	MailNickname               string      `json:"mailNickname"               orm:"mail_nickname"                  description:"邮件别名 - 邮箱别名。"`                                                                                                        // 邮件别名 - 邮箱别名。
	CreatedAt                  *gtime.Time `json:"createdAt"                  orm:"created_at"                     description:"创建时间 - 记录创建时间。"`                                                                                                      // 创建时间 - 记录创建时间。
	UpdatedAt                  *gtime.Time `json:"updatedAt"                  orm:"updated_at"                     description:"更新时间 - 记录最后更新时间。"`                                                                                                    // 更新时间 - 记录最后更新时间。
}
