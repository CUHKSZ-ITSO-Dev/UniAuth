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

// GetTodayTotalConsumptionReq 当天总消费
type GetTodayTotalConsumptionReq struct {
	g.Meta `path:"/stats/today/total" tags:"Billing/Status" method:"GET" summary:"今日总消费" dc:"获取今天的总消费金额统计"`

	/* QuotaPool string `json:"quotaPool" dc:"依据配额池名称查询，默认统计全部" example:"student_pool"`
	   Service   string `json:"service"   dc:"依据服务类型查询，默认统计全部" example:"chat"`*/
}

type GetTodayTotalRes struct {
	Date         string  `json:"date"             dc:"日期，格式：2025-10-01"`
	TotalCostCNY float64 `json:"totalCostCNY"     dc:"总消费金额（CNY）"`
	TotalCostUSD float64 `json:"totalCostUSD"     dc:"总消费金额（USD）"`
	IncreaseRate float64 `json:"increaseRate"     dc:"消费增加率"`
}

// GetModelUsageChartReq 最近模型调用次数图标生成（折线+条形图）
type GetModelUsageChartReq struct {
	g.Meta `path:"/stats/model/usage" tags:"Billing/Status" method:"GET" summary:"最近模型调用次数" dc:"获取最近N天的模型调用次数统计，支持折线图和条形图展示"`

	NDays int `json:"nDays"     v:"required|integer|min:1|max:90" d:"7" example:"7" dc:"最近N天，默认7天"`
	/* Service   string `json:"service"   dc:"依据服务类型查询，默认统计全部"         example:"chat"`
	   QuotaPool string `json:"quotaPool" dc:"依据配额池名称查询，不传则统计全部"     example:"student_pool"`*/
}

type GetModelUsageChartRes struct {
	// 折线图数据：按日期
	LineChartData *gjson.Json `json:"lineChartData" dc:"折线图数据，格式：[{date: string, models: [{model: string, count: int}]}]"`
	// 条形图数据：按模型
	BarChartData *gjson.Json `json:"barChartData"  dc:"条形图数据，格式：[{model: string, totalCount: int, avgCount: float}]"`
	TotalCalls   int         `json:"totalCalls"    dc:"总调用次数"`
	DateRange    *gjson.Json `json:"dateRange"     dc:"日期范围，格式：{start: string, end: string}"`
}

// GetModelConsumptionReq 最近指定天数模型消费
type GetModelConsumptionReq struct {
	g.Meta `path:"/stats/model/consumption" tags:"Billing/Status" method:"GET" summary:"最近指定天数模型消费" dc:"获取最近指定天数按模型分组的消费金额统计"`

	NDays  int    `json:"nDays"     v:"required|integer|min:1|max:90" d:"7" example:"7" dc:"最近N天，默认7天"`
	Models string `json:"models"   example:"chatGPT" dc:"依据模型查询，默认统计全部"         `
QuotaPool string `json:"quotaPool" dc:"依据配额池查询，默认统计全部"         example:"student_pool"`
	GroupBy string `json:"groupBy"   v:"in:date,model" d:"model"             dc:"校验：date(按日期) 或 model(按模型)，默认按模型"`
}

type GetModelConsumptionRes struct {
	// 按模型分组的消费数据
	ModelConsumption *gjson.Json `json:"modelConsumption" dc:"按模型分组的消费数据，格式：[{model: string, totalCost: float, callCount: int, avgCost: float}]"`
	// 按日期分组的消费数据（当groupBy=date时）
	DateConsumption *gjson.Json `json:"dateConsumption"  dc:"按日期分组的消费数据，格式：[{date: string, models: [{model: string, cost: float, count: int}]}]"`
	TotalCost       float64     `json:"totalCost"        dc:"总消费金额（CNY）"`
	TotalCalls      int         `json:"totalCalls"       dc:"总调用次数"`
	DateRange       *gjson.Json `json:"dateRange"        dc:"日期范围，格式：{start: string, end: string}"`
}
