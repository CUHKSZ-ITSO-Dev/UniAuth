package v1

import (
	"github.com/gogf/gf/v2/encoding/gjson"
	"github.com/gogf/gf/v2/frame/g"
)

// GetTodayTotalConsumptionReq 当天总消费(分配额池和服务查询）
type GetTodayTotalConsumptionReq struct {
	g.Meta    `path:"/stats/today/total" tags:"Billing/Status" method:"GET" summary:"今日总消费" dc:"获取今天的总消费金额统计"`
	QuotaPool string `json:"quotaPool" dc:"依据配额池名称查询，默认统计全部" example:"student_pool"`
	Service   string `json:"service"   dc:"依据服务类型查询，默认统计全部" example:"chat"`
}

// GetTodayTotalRes 当天总消费(分配额池和服务查询)响应
type GetTodayTotalRes struct {
	Date          string  `json:"date"             dc:"日期,格式:2025-10-01"`
	TotalCostCNY  float64 `json:"totalCostCNY"     dc:"总消费金额(CNY)"`
	IncreaseRate  float64 `json:"increaseRate"     dc:"消费增加率"`
	QuotaPoolName string  `json:"quotaPoolName" dc:"依据配额池名称查询，默认统计全部" example:"student_pool"`
	ServiceName   string  `json:"serviceName" dc:"依据服务类型查询，默认统计全部" example:"chat"`
}

// GetModelUsageChartReq 分类查询模型调用图表生成
type GetModelUsageChartReq struct {
	g.Meta `path:"/stats/model/usage" tags:"Billing/Status" method:"GET" summary:"模型调用次数图表"`

	NDays     int    `json:"nDays" v:"required|integer|min:1|max:90" d:"7" dc:"最近N天"`
	Service   string `json:"service" dc:"按服务过滤"`
	QuotaPool string `json:"quotaPool" dc:"按配额池过滤"`
	Product   string `json:"product" dc:"按模型过滤"`
}

// GetModelUsageChartRes 分类查询模型调用图表生成响应
type GetModelUsageChartRes struct {
	LineChartData *gjson.Json `json:"lineChartData" dc:"折线图数据"`
	BarChartData  *gjson.Json `json:"barChartData" dc:"条形图数据"`
	TotalCalls    int         `json:"totalCalls" dc:"总调用次数"`
	DateRange     *gjson.Json `json:"dateRange" dc:"日期范围"`
}

// GetModelConsumptionReq 分类查询消费总金额
type GetModelConsumptionReq struct {
	g.Meta `path:"/stats/model/consumption" tags:"Billing/Status" method:"GET" summary:"模型消费金额"`

	NDays int `json:"nDays" v:"required|integer|min:1|max:90" d:"7" dc:"最近N天"`
	/* 需要设计指定日期的消费总金额入参吗
	StartTime string `json:"startTime" dc:"开始日期（与 nDays 二选一）" example:"2024-09-01"`
	EndTime   string `json:"endTime" dc:"结束日期（与 nDays 二选一）" example:"2024-10-01"`*/
	Service   string `json:"service" dc:"按服务过滤"`
	QuotaPool string `json:"quotaPool" dc:"按配额池过滤"`
	Product   string `json:"product" dc:"按模型过滤"`
}

// GetModelConsumptionRes 分类查询消费总金额响应
type GetModelConsumptionRes struct {
	ModelConsumption *gjson.Json `json:"modelConsumption" dc:"按模型分组"`
	DateConsumption  *gjson.Json `json:"dateConsumption" dc:"按日期分组"`
	TotalCost        float64     `json:"totalCost" dc:"总消费"`
	TotalCalls       int         `json:"totalCalls" dc:"总调用次数"`
	DateRange        *gjson.Json `json:"dateRange" dc:"日期范围"`
}

// GetActiveUsersReq  按消费记录获取活跃用户数
type GetActiveUsersReq struct {
	g.Meta `path:"/getActiveUser" tags:"Billing/status" method:"GET" summary:"按消费记录查询活跃用户" dc:"查询指定天数内的活跃用户"`
	Days   int `json:"days" dc:"统计活跃用户的天数，默认30天" d:"30"`
}

type GetActiveUsersRes struct {
	ActiveUsers   int     `json:"activeUsers" dc:"当天活跃用户数"`
	ActiveRateInc float64 `json:"activeRateInc" dc:"活跃率增加"`
	Date          string  `json:"date" dc:"人数对应的日期" example:"2025-10-01"`
	TotalUsers    int     `json:"totalUsers" dc:"总统计人数"`
	Base          float64 `json:"base" dc:"活跃统计标准"`
}
