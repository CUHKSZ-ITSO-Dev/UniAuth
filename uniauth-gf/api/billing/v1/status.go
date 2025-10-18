package v1

import (
	"github.com/gogf/gf/v2/encoding/gjson"
	"github.com/gogf/gf/v2/frame/g"
)

// GetConsumptionByModelReq 分模型服务平台查询
type GetConsumptionByModelReq struct {
	g.Meta `path:"/status/service/consumption" tags:"Billing/Status" method:"GET" summary:"分模型服务平台查询" dc:"获取指定服务平台下各个模型的消费统计"`

	Service   string `json:"service"   v:"required" example:"ITSO"     dc:"服务平台名称，如ITSO"` //???
	Models    string `json:"models "   v:"required" example:"chatGPT" dc:"服务平台名称，如 chat, openai, claude 等"`
	StartTime string `json:"startTime" dc:"开始时间，允许不传值"         example:"2025-09-01"`
	EndTime   string `json:"endTime"   dc:"结束时间，允许不传值"         example:"2025-10-01"`
}

type GetConsumptionByModelRes struct {
	Service        string      `json:"serviceName"  dc:"服务平台的名称"`
	TotalCost      float64     `json:"totalCost"    dc:"总消费金额（CNY/USD）"`
	ModelBreakdown *gjson.Json `json:"modelBreakdown" dc:"延迟解析或动态处理未知结构的JSON字段格式：[{model: string, cost: float, count: int, percentage: float}]"`
}

// 注意: GetTodayTotalConsumptionReq, GetProductUsageChartReq, GetProductConsumptionReq
// 等统计相关的类型定义已迁移到 stats.go 文件中
