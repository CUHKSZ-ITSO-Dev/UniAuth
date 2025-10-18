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

type GetBillRecordReq struct {
	g.Meta     `path:"/admin/get" tags:"Billing/Admin" method:"post" summary:"查询账单" dc:"查询账单，根据一定的条件。有两个类型的账单，需要指定 type：<br>1. type = qp，返回每个配额池名下特定upns相关的账单；<br>2. type = upn，返回每个upn名下这些特定qps相关的账单。<br>数组传空时，则忽略对应的限制。"`
	Type       string   `json:"type" jsonschema:"required,enum:qp,upn" jsonschema_description:"类型：qp - 配额池模式，upn - UPN模式。" dc:"类型" v:"required|in:qp,upn"`
	Upns       []string `json:"upns" jsonschema_description:"UPN列表" dc:"UPN列表" example:"['122020255@link.cuhk.edu.cn']"`
	QuotaPools []string `json:"quotaPools" jsonschema_description:"配额池列表" dc:"配额池" example:"['student_pool']"`
	Svc        []string `json:"svc" jsonschema_description:"服务列表" dc:"服务" example:"['chat', 'voice']"`
	Product    []string `json:"product" jsonschema_description:"产品列表" dc:"产品" example:"['chat', 'voice']"`
	StartTime  string   `json:"startTime" jsonschema:"required" jsonschema_description:"开始时间" v:"required" dc:"开始时间" example:"2024-01-01"`
	EndTime    string   `json:"endTime" jsonschema:"required" jsonschema_description:"结束时间" v:"required" dc:"结束时间" example:"2024-01-01"`
	Order      string   `json:"order" jsonschema:"enum:asc,desc" jsonschema_description:"账单返回时按照账单创建时间排序。默认倒序 desc。" v:"in:asc,desc" d:"desc"`
}
type GetBillRecordRes struct {
	Records *gjson.Json `json:"records" jsonschema_description:"账单记录"`
}
