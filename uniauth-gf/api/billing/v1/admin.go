package v1

import (
	"github.com/gogf/gf/v2/encoding/gjson"
	"github.com/gogf/gf/v2/frame/g"
)

// admin：主要是处理账单导出、账单查询等功能

type ExportBillRecordReq struct {
	g.Meta     `path:"/admin/export" tags:"Billing/Admin" method:"post" summary:"导出账单" dc:"导出账单，根据一定的条件。有两个类型的账单，需要指定 type：<br>1. type = qp，返回每个配额池名下特定upns相关的账单；<br>2. type = upn，返回每个upn名下这些特定qps相关的账单。<br>数组传空时，则忽略对应的限制。"`
	Type       string   `json:"type" dc:"类型" v:"required|in:qp,upn"`
	Upns       []string `json:"upns" dc:"UPN列表" example:"['122020255@link.cuhk.edu.cn']"`
	QuotaPools []string `json:"quotaPools" dc:"配额池" example:"['student_pool']"`
	Svc        []string `json:"svc" dc:"服务" example:"['chat', 'voice']"`
	Product    []string `json:"product" dc:"产品" example:"['chat', 'voice']"`
	StartTime  string   `json:"startTime" v:"required" dc:"开始时间" example:"2024-01-01"`
	EndTime    string   `json:"endTime" v:"required" dc:"结束时间" example:"2024-01-01"`
	Order      string   `json:"order" dc:"账单返回时按照账单创建时间排序。默认正序 asc。" v:"required|in:asc,desc" d:"asc"`
}
type ExportBillRecordRes struct {
}

type PaginationReq struct {
	Page     int `json:"page" v:"min:1" dc:"页码-从1开始"`
	PageSize int `json:"pageSize" v:"min:1|max:1000" dc:"每页条数-最大1000"`
}

type GetBillRecordReq struct {
	g.Meta      `path:"/admin/get" tags:"Billing/Admin" method:"post" summary:"查询账单" dc:"查询账单，根据一定的条件。有两个类型的账单，需要指定 type：<br>1. type = qp，返回每个配额池名下特定upns相关的账单；<br>2. type = upn，返回每个upn名下这些特定qps相关的账单。<br>数组传空时，则忽略对应的限制。"`
	Type        string        `json:"type" dc:"类型" v:"required|in:qp,upn"`
	Upns        []string      `json:"upns" dc:"UPN列表" example:"['122020255@link.cuhk.edu.cn']"`
	QuotaPools  []string      `json:"quotaPools" dc:"配额池" example:"['student_pool']"`
	Svc         []string      `json:"svc" dc:"服务" example:"['chat', 'voice']"`
	Product     []string      `json:"product" dc:"产品" example:"['chat', 'voice']"`
	StartTime   string        `json:"startTime" v:"required" dc:"开始时间" example:"2024-01-01"`
	EndTime     string        `json:"endTime" v:"required" dc:"结束时间" example:"2024-01-01"`
	Order       string        `json:"order" dc:"账单返回时按照账单创建时间排序。默认倒序 desc。" v:"required|in:asc,desc" d:"desc"`
	Pagination  PaginationReq `json:"pagination" dc:"分页信息（可选），不传则默认返回全部"`
	UpnKeywords string        `json:"keywords" dc:"关键词模糊搜索，目前仅支持按照 upn 模糊搜索（可选）"`
}
type GetBillRecordRes struct {
	Records    *gjson.Json `json:"records"`
	Page       int         `json:"page" dc:"当前页码"`
	PageSize   int         `json:"pageSize" dc:"每页条数"`
	TotalCount int         `json:"totalCount" dc:"总记录数"`
	TotalPages int         `json:"totalPages" dc:"总页数"`
}

type GetBillAmountReq struct {
	g.Meta     `path:"/admin/amount" tags:"Billing/Admin" method:"post" summary:"查询账单总金额" dc:"查询账单总金额，根据一定的条件。有两个类型的账单，需要指定 type：<br>1. type = qp，返回每个配额池名下特定upns相关的账单总金额；<br>2. type = upn，返回每个upn名下这些特定qps相关的账单总金额。<br>数组传空时，则忽略对应的限制。"`
	Type       string   `json:"type" dc:"类型" v:"required|in:qp,upn"`
	Upns       []string `json:"upns" dc:"UPN列表" example:"['122020255@link.cuhk.edu.cn']"`
	QuotaPools []string `json:"quotaPools" dc:"配额池" example:"['student_pool']"`
	Svc        []string `json:"svc" dc:"服务" example:"['chat', 'voice']"`
	Product    []string `json:"product" dc:"产品" example:"['chat', 'voice']"`
	StartTime  string   `json:"startTime" v:"required" dc:"开始时间" example:"2024-01-01"`
	EndTime    string   `json:"endTime" v:"required" dc:"结束时间" example:"2024-01-01"`
}
type GetBillAmountRes struct {
	Amount string `json:"amount" dc:"总金额"`
}
