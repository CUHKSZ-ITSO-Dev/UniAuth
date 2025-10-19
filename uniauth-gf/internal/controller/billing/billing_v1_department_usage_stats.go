package billing

import (
	"context"

	v1 "uniauth-gf/api/billing/v1"

	"github.com/gogf/gf/v2/encoding/gjson"
)

func (c *ControllerV1) DepartmentUsageStats(ctx context.Context, req *v1.DepartmentUsageStatsReq) (res *v1.DepartmentUsageStatsRes, err error) {
	res = &v1.DepartmentUsageStatsRes{
		StatsData: gjson.New(map[string]interface{}{
			"2025-10-19": map[string]interface{}{
				"SDS": 125.50,
				"SME": 89.30,
				"SSE": 67.80,
			},
		}),
	}
	return
}
