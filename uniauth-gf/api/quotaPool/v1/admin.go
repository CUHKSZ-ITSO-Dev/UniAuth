package v1

import "github.com/gogf/gf/v2/frame/g"

type ResetBalanceReq struct {
	g.Meta    `path:"/admin/resetBalance" tags:"QuotaPool/Admin" method:"post" summary:"重置配额池"`
	QuotaPool string `json:"quotaPool" v:"required" dc:"配额池" example:"student_pool"`
}
type ResetBalanceRes struct {
	OK  bool   `json:"ok" dc:"是否成功"`
	Err string `json:"err" dc:"错误信息"`
}

type BatchModifyQuotaPoolReq struct {
	g.Meta  `path:"/admin/batchModify" tags:"QuotaPool/Admin" method:"post" summary:"批量修改配额池"`
	Filter  *FilterGroup `json:"filter" v:"required" dc:"筛选条件"`
	Field   string       `json:"field" v:"required|in:disabled,personal" dc:"要修改的字段"`
	Value   *g.Var       `json:"value" v:"required" dc:"新值"`
	Preview bool         `json:"preview" d:"false" dc:"预览模式，不执行修改，仅返回受影响的记录"`
}

type BatchModifyQuotaPoolRes struct {
	OK                bool     `json:"ok" dc:"是否成功"`
	Err               string   `json:"err,omitempty" dc:"错误信息"`
	AffectedCount     int      `json:"affectedCount" dc:"受影响的记录数"`
	AffectedPoolNames []string `json:"affectedPoolNames,omitempty" dc:"受影响的配额池名称列表"`
}
