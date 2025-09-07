package v1

import "github.com/gogf/gf/v2/frame/g"

type ResetBalanceReq struct {
	g.Meta `path:"/admin/resetBalance" tags:"QuotaPool/Admin" method:"post" summary:"重置配额池"`
	QuotaPool string `json:"quotaPool" v:"required" dc:"配额池" example:"student_pool"`
}
type ResetBalanceRes struct {
	OK bool `json:"ok" dc:"是否成功"`
	Err string `json:"err" dc:"错误信息"`
}

type BatchQuotaPoolDisabledReq struct {
	g.Meta `path:"/admin/batchModify" tags:"QuotaPool/Admin" method:"post" summary:"批量修改配额池"`
	QuotaPools []string `json:"quotaPools" v:"required" dc:"配额池" example:"['quotaPool1', 'quotaPool2']"`
	Field string `json:"field" v:"required" dc:"字段" example:"disabled"`
	Value bool `json:"value" v:"required" dc:"值" example:"true"`
}
type BatchQuotaPoolDisabledRes struct {
	OK bool `json:"ok" dc:"是否成功"`
	Err string `json:"err" dc:"错误信息"`
}