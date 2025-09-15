package v1

import (
	"github.com/gogf/gf/v2/encoding/gjson"
	"github.com/gogf/gf/v2/frame/g"
)

type NDaysProductUsageChartReq struct {
	g.Meta `path:"/stats/chat/usage/chart" tags:"Billing/Stats" method:"GET" summary:"对话服务产品使用次数统计接口（详细）" dc:"可以传入最近N天参数。"`
	N      int `d:"7" example:"3" dc:"N Days"`
}

type NDaysProductUsageChartRes struct {
	ChartData *gjson.Json `json:"chartData"`
}

type NDaysProductUsageGroupReq struct {
	g.Meta `path:"/stats/chat/usage/group" tags:"Billing/Stats" method:"GET" summary:"对话服务产品使用次数统计接口（聚合）" dc:"可以传入最近N天参数。"`
	N      int `d:"7" example:"3" dc:"N Days"`
}

type NDaysProductUsageGroupRes struct {
	GroupData *gjson.Json `json:"groupData"`
}
