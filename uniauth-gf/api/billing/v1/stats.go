package v1

import (
	"uniauth-gf/internal/model/entity"

	"github.com/gogf/gf/v2/encoding/gjson"
	"github.com/gogf/gf/v2/frame/g"
	"github.com/shopspring/decimal"
)

// GetTodayTotalConsumptionReq 当天总消费(可以按服务类型查询）
type GetTodayTotalConsumptionReq struct {
	g.Meta  `path:"/stats/today/total" tags:"Billing/Status" method:"GET" summary:"今日总消费" dc:"获取今天的总消费金额统计"`
	Service string `json:"service"   dc:"依据服务类型查询，默认统计全部" example:"chat"`
}

// GetTodayTotalConsumptionRes 当天总消费(分服务查询)响应
type GetTodayTotalConsumptionRes struct {
	Date         string          `json:"date"             dc:"日期,格式:2025-10-01"`
	TotalCostCNY decimal.Decimal `json:"totalCostCNY"     dc:"总消费金额(CNY)"`
	IncreaseRate float64         `json:"increaseRate"     dc:"消费增加率"`
	ServiceName  string          `json:"serviceName" dc:"依据服务类型查询，默认统计全部" example:"chat"`
}

// GetProductUsageChartReq 分类查询模型调用图表生成
type GetProductUsageChartReq struct {
	g.Meta    `path:"/stats/model/usage" tags:"Billing/Status" method:"GET" summary:"模型调用次数图表"`
	NDays     int    `json:"nDays" v:"integer|min:1|max:90" d:"7" dc:"最近N天,默认7天"`
	Service   string `json:"service" dc:"按服务过滤"`
	QuotaPool string `json:"quotaPool" dc:"按配额池过滤"`
	Product   string `json:"product" dc:"按模型过滤"`
}

// GetProductUsageChartRes 分类查询模型调用图表生成响应
type GetProductUsageChartRes struct {
	LineChartData *gjson.Json `json:"lineChartData" dc:"折线图数据,dates为日期数组,series为各维度的时间序列" example:"{\"dates\":[\"2025-10-01\",\"2025-10-02\"],\"series\":[{\"name\":\"gpt-4\",\"service\":\"chat\",\"data\":[100,111]}]}"`
	BarChartData  *gjson.Json `json:"barChartData" dc:"条形图数据，按模型分别总调用次数" example:"{\"labels\":[\"gpt-4\",\"gpt-3.5\"],\"data\":[100,111]}"`
	TotalCalls    int         `json:"totalCalls" dc:"总调用次数（当前分类下）"`
}

// GetProductConsumptionReq 分类查询消费总金额
type GetProductConsumptionReq struct {
	g.Meta    `path:"/stats/model/consumption" tags:"Billing/Status" method:"GET" summary:"模型消费金额"`
	NDays     int    `json:"nDays" v:"integer|min:1|max:90" d:"7" dc:"最近N天,默认7天"`
	Service   string `json:"service" dc:"按服务过滤" example:"chat"`
	QuotaPool string `json:"quotaPool" dc:"按配额池过滤" example:"student_pool"`
	Product   string `json:"product" dc:"按模型过滤"`
}

// GetProductConsumptionRes 分类查询消费总金额响应
type GetProductConsumptionRes struct {
	StartDate          string          `json:"startDate" dc:"统计起始日期" example:"2025-10-01"`
	EndDate            string          `json:"endDate" dc:"统计结束日期" example:"2025-10-07"`
	ProductConsumption *gjson.Json     `json:"productConsumption" dc:"按模型分组的消费统计" example:"[{\"product\":\"gpt-4\",\"service\":\"chat\",\"quotaPool\":\"student_pool\",\"cost\":1000.00,\"calls\":100}]"`
	DateConsumption    *gjson.Json     `json:"dateConsumption" dc:"按日期分组的消费统计" example:"[{\"date\":\"2025-10-15\",\"product\":\"gpt-4\",\"service\":\"chat\",\"quotaPool\":\"student_pool\",\"cost\":100.00,\"calls\":100}]"`
	TotalCalls         int             `json:"totalCalls" dc:"总调用次数(当前分类下)"`
	TotalCost          decimal.Decimal `json:"totalCost" dc:"总消费（当前条件下）"`
}

// GetActiveUsersNumReq  按消费记录获取活跃用户数
type GetActiveUsersNumReq struct {
	g.Meta `path:"/stats/active-users/summary" tags:"Billing/Status" method:"GET" summary:"按消费记录查询活跃用户" dc:"查询指定天数内的活跃用户"`
	Days   int `json:"days" v:"min:1|max:365" dc:"统计活跃用户的天数,默认30天" d:"30"`
}

type ActiveUserList struct {
	ActiveUsersNum int     `json:"activeUsersNum" dc:"当天活跃用户数"`
	ActiveRateInc  float64 `json:"activeRateInc" dc:"活跃率增加"`
	Date           string  `json:"date" dc:"人数对应的日期" example:"2025-10-01"`
}

// GetActiveUsersNumRes 按消费记录获取活跃用户数响应
type GetActiveUsersNumRes struct {
	ActiveUsers      []ActiveUserList `json:"activeUsers" dc:"每天活跃用户数列表,格式{\"activeUsersNum\":100,\"ActiveRateInc\":50.00,\"Date\":\"2025-10-01\"}"`
	TotalUsers       int              `json:"totalUsers" dc:"总用户人数"`
	TotalActiveUsers int              `json:"totalActiveUsers" dc:"总活跃用户人数"`
}

// GetAllActiveUsersReq 获取活跃用户信息(概览）,点击详情返回具体值
type GetAllActiveUsersReq struct {
	g.Meta    `path:"/stats/active-users/list" tags:"Billing/Status" method:"GET" summary:"返回指定天数内活跃用户的所有信息"`
	Days      int    `json:"days" v:"min:1|max:365" dc:"返回指定天数的活跃用户信息,默认七天" d:"7"`
	Page      int    `json:"page" v:"min:1" d:"1" dc:"分页页码,从1开始"`
	PageSize  int    `json:"pageSize" v:"min:1|max:30" d:"10" dc:"每页条数,默认10,最大30"`
	SortBy    string `json:"sortBy" v:"in:cost,calls,upn,last_active" d:"cost" dc:"排序条件:cost(花费),calls(调用次数),upn(用户名),last_active(最后活跃时间)"`
	SortOrder string `json:"sortOrder" v:"in:asc,desc" d:"desc" dc:"按升序(asc)还是降序(desc)排列"`
}

type ActiveUserSummary struct {
	Upn        string          `json:"upn" dc:"用户标识"`
	TotalCost  decimal.Decimal `json:"totalCost" dc:"总消费金额"`
	TotalCalls int             `json:"totalCalls" dc:"总调用次数"`
	LastActive string          `json:"lastActive" dc:"最后活跃时间"`
}

// GetAllActiveUsersRes 获取活跃用户信息响应
type GetAllActiveUsersRes struct {
	ActiveUsers []*ActiveUserSummary `json:"activeUsers" dc:"返回活跃用户信息列表"`
	Total       int                  `json:"total" dc:"活跃用户总数"`
	Page        int                  `json:"page" dc:"当前页码(用户想访问第几页的数据)"`
	PageSize    int                  `json:"pageSize" dc:"每页条数"`
	TotalPages  int                  `json:"totalPages" dc:"总页数"`
}

// GetAllServiceNameReq 返回所有服务的名称
type GetAllServiceNameReq struct {
	g.Meta `path:"/stats/service/list" tags:"Billing/Status" method:"GET"  summary:"返回所有服务名称	" `
}

// GetAllServiceNameRes 返回所有服务的名称查询响应
type GetAllServiceNameRes struct {
	ServiceName []string `json:"serviceName" dc:"返回所有服务名称"`
}

// GetActiveUserDetailReq 点击详情查询某个活跃用户详细信息
type GetActiveUserDetailReq struct {
	g.Meta `path:"/stats/active-users/detail" tags:"Billing/Status" method:"GET" summary:"查询某用户具体信息"`
	Upn    string `json:"upn" v:"required" dc:"用户唯一标识"`
	NDays  int    `json:"nDays" v:"required" dc:"当前查询的指定天数"`
}

// GetActiveUserDetailRes 查询某个活跃用户详细信息响应
type GetActiveUserDetailRes struct {
	UserInfo   entity.UserinfosUserInfos `json:"userInfo" dc:"用户基本信息"`
	TotalCost  decimal.Decimal           `json:"totalCost" dc:"个人总消费金额(CNY)"`
	TotalCalls int                       `json:"totalCalls" dc:"个人总调用次数"`
	LastActive string                    `json:"lastActive" dc:"最后活跃时间"`
}
