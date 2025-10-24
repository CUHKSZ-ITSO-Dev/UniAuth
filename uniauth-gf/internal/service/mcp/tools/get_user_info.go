package tools

import (
	"context"

	"github.com/gogf/gf/v2/errors/gerror"
	"github.com/gogf/gf/v2/frame/g"
	"github.com/gogf/gf/v2/util/gconv"
	"github.com/mark3labs/mcp-go/mcp"
	"github.com/mark3labs/mcp-go/server"

	v1 "uniauth-gf/api/userinfos/v1"
	"uniauth-gf/internal/controller/userinfos"
)

// UserinfosUserInfosDTO 是用于 MCP 工具输出的数据传输对象（DTO）
// 此结构体专门用于 get_user_info 工具的 JSON 输出，移除了不必要的 orm 标签
// 与 entity.UserinfosUserInfos 的主要区别：
// 1. 移除了 orm 标签（不需要数据库映射）
// 2. 时间字段使用 string 类型（便于 JSON 序列化）
// 3. 仅保留 json 和 description 标签用于 MCP 工具输出
type UserinfosUserInfosDTO struct {
	Upn                        string   `json:"upn"                        description:"UPN - 唯一。用户名@cuhk.edu.cn 或 学号@link.cuhk.edu.cn。用户登录名。"`                                                               // UPN - 唯一。用户名@cuhk.edu.cn 或 学号@link.cuhk.edu.cn。用户登录名。
	Email                      string   `json:"email"                      description:"邮箱 - 唯一。用户名@cuhk.edu.cn。"`                                                                                            // 邮箱 - 唯一。用户名@cuhk.edu.cn。
	DisplayName                string   `json:"displayName"                description:"显示名 - 显示名。"`                                                                                                          // 显示名 - 显示名。
	SchoolStatus               string   `json:"schoolStatus"               description:"在校状态 - 当前在校状态：Employed | Dimission | In-School | Graduation | Withdraw | Emeritus. （在岗 | 离职 | 在校 | 毕业 | 退学 | 荣誉退休。）"` // 在校状态 - 当前在校状态：Employed | Dimission | In-School | Graduation | Withdraw | Emeritus. （在岗 | 离职 | 在校 | 毕业 | 退学 | 荣誉退休。）
	IdentityType               string   `json:"identityType"               description:"身份 - 身份类型：Fulltime | CO | Student | Parttime。（全职 | 附属单位 | 学生 | 兼职。）"`                                                 // 身份 - 身份类型：Fulltime | CO | Student | Parttime。（全职 | 附属单位 | 学生 | 兼职。）
	EmployeeId                 string   `json:"employeeId"                 description:"员工/学号 - 唯一。6位员工编号或9/10位学号。"`                                                                                          // 员工/学号 - 唯一。6位员工编号或9/10位学号。
	Name                       string   `json:"name"                       description:"全名 - 唯一。全名。"`                                                                                                         // 全名 - 唯一。全名。
	Tags                       []string `json:"tags"                       description:"标签 - 用户标签。"`                                                                                                          // 标签 - 用户标签。
	Department                 string   `json:"department"                 description:"部门 - 部门信息。"`                                                                                                          // 部门 - 部门信息。
	Title                      string   `json:"title"                      description:"职务 - 职务名称。"`                                                                                                          // 职务 - 职务名称。
	Office                     string   `json:"office"                     description:"办公室 - 办公地点。"`                                                                                                         // 办公室 - 办公地点。
	OfficePhone                string   `json:"officePhone"                description:"办公电话 - 办公室电话。"`                                                                                                       // 办公电话 - 办公室电话。
	EmployeeType               string   `json:"employeeType"               description:"员工类型 - 员工类型。"`                                                                                                        // 员工类型 - 员工类型。
	FundingTypeOrAdmissionYear string   `json:"fundingTypeOrAdmissionYear" description:"经费类型/入学年份 - 教职员经费类型（uni/researchPro/Other）或学生4位入学年份"`                                                                 // 经费类型/入学年份 - 教职员经费类型（uni/researchPro/Other）或学生4位入学年份
	StudentCategoryPrimary     string   `json:"studentCategoryPrimary"     description:"学历大类 - Postgraduate/Undergraduate 研究生/本科生"`                                                                           // 学历大类 - Postgraduate/Undergraduate 研究生/本科生
	StudentCategoryDetail      string   `json:"studentCategoryDetail"      description:"学历细类 - Master/Ph.D./Undergraduate 硕士/博士/本科"`                                                                          // 学历细类 - Master/Ph.D./Undergraduate 硕士/博士/本科
	StudentNationalityType     string   `json:"studentNationalityType"     description:"学生类别 - Local/Exchange/International/CUCDMP/HMT 本地/交换/国际/本部/港澳台"`                                                      // 学生类别 - Local/Exchange/International/CUCDMP/HMT 本地/交换/国际/本部/港澳台
	ResidentialCollege         string   `json:"residentialCollege"         description:"书院 - 书院缩写（如SHAW）"`                                                                                                    // 书院 - 书院缩写（如SHAW）
	StaffRole                  string   `json:"staffRole"                  description:"教职员角色 - Teaching/Admin/VisitingStudent/Alumni/Other 教学/行政/访问学生/校友/其他"`                                                // 教职员角色 - Teaching/Admin/VisitingStudent/Alumni/Other 教学/行政/访问学生/校友/其他
	SamAccountName             string   `json:"samAccountName"             description:"SAM账户名 - Windows账户名。"`                                                                                                // SAM账户名 - Windows账户名。
	MailNickname               string   `json:"mailNickname"               description:"邮件别名 - 邮箱别名。"`                                                                                                        // 邮件别名 - 邮箱别名。
	CreatedAt                  string   `json:"createdAt"                  description:"创建时间 - 记录创建时间。"`                                                                                                      // 创建时间 - 记录创建时间。
	UpdatedAt                  string   `json:"updatedAt"                  description:"更新时间 - 记录最后更新时间。"`                                                                                                    // 更新时间 - 记录最后更新时间。
}

func RegisterGetUserInfo(s *server.MCPServer) error {
	tool := mcp.NewTool("get_user_info",
		mcp.WithDescription("给定 upn，返回用户的所有基本信息。"),
		mcp.WithInputSchema[v1.GetOneReq](),
		mcp.WithOutputSchema[UserinfosUserInfosDTO](),
	)

	// Add the calculator handler
	handler := func(ctx context.Context, request mcp.CallToolRequest, args v1.GetOneReq) (UserinfosUserInfosDTO, error) {
		// Using helper functions for type-safe argument access
		res, err := userinfos.NewV1().GetOne(ctx, &args)
		if err != nil {
			return UserinfosUserInfosDTO{}, gerror.Wrap(err, "获取用户信息失败")
		}
		if res == nil {
			return UserinfosUserInfosDTO{}, gerror.New("找不到用户")
		}
		var userInfo UserinfosUserInfosDTO
		if gconv.Struct(res, &userInfo) != nil {
			return UserinfosUserInfosDTO{}, gerror.New("转换用户信息失败")
		}
		g.Dump(userInfo)
		return userInfo, nil
	}

	s.AddTool(tool, mcp.NewStructuredToolHandler(handler))
	return nil
}
