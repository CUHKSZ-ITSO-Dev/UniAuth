package v1

import (
	"github.com/gogf/gf/v2/encoding/gjson"
	"github.com/gogf/gf/v2/frame/g"
)

// admin：主要是处理账单导出、账单查询等功能

type ExportBillRecordReq struct {
	g.Meta     `path:"/admin/export" tags:"Billing/Admin" method:"post" summary:"导出账单" dc:"导出账单，根据一定的条件。有两个类型的账单：<br>1. 配额池出账（可以传Array），每个配额池的账单会在不同的工作表里面；<br>2. 个人出账（可以传Array），每个人的消费记录会在不同的工作表里面。<br>QuotaPool 数组和 UPN 数组只能同时传一个。"`
	Upns       []string `json:"upns" dc:"UPN列表" example:"['122020255@link.cuhk.edu.cn']"`
	QuotaPools []string `json:"quotaPools" dc:"配额池" example:"['student_pool']"`
	Svc        []string `json:"svc" dc:"服务" example:"['chat', 'voice']"`
	Product    []string `json:"product" dc:"产品" example:"['chat', 'voice']"`
	StartTime  string   `json:"startTime" v:"required" dc:"开始时间" example:"2024-01-01"`
	EndTime    string   `json:"endTime" v:"required" dc:"结束时间" example:"2024-01-01"`
}
type ExportBillRecordRes struct {
}

type GetBillRecordReq struct {
	g.Meta     `path:"/admin/get" tags:"Billing/Admin" method:"post" summary:"查询账单" dc:"查询账单，根据一定的条件。有两个类型的账单：<br>1. 配额池出账（可以传Array），每个配额池的账单会在不同的工作表里面；<br>2. 个人出账（可以传Array），每个人的消费记录会在不同的工作表里面。<br>QuotaPool 数组和 UPN 数组只能同时传一个。"`
	Upns       []string `json:"upns" dc:"UPN列表" example:"['122020255@link.cuhk.edu.cn']"`
	QuotaPools []string `json:"quotaPools" dc:"配额池" example:"['student_pool']"`
	Svc        []string `json:"svc" dc:"服务" example:"['chat', 'voice']"`
	Product    []string `json:"product" dc:"产品" example:"['chat', 'voice']"`
	StartTime  string   `json:"startTime" v:"required" dc:"开始时间" example:"2024-01-01"`
	EndTime    string   `json:"endTime" v:"required" dc:"结束时间" example:"2024-01-01"`
}
type GetBillRecordRes struct {
	Records *gjson.Json `json:"records"`
}
