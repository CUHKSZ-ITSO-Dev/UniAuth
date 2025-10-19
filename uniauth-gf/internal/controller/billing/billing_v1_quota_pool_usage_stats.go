package billing

import (
	"context"

	v1 "uniauth-gf/api/billing/v1"

	"github.com/gogf/gf/v2/encoding/gjson"
)

func (c *ControllerV1) QuotaPoolUsageStats(ctx context.Context, req *v1.QuotaPoolUsageStatsReq) (res *v1.QuotaPoolUsageStatsRes, err error) {

	res = &v1.QuotaPoolUsageStatsRes{
		StatsData: gjson.New(map[string]interface{}{
			"2025-10-19": map[string]interface{}{
				"itso-deep-research-vip": 125.50,
				"student-pool":           89.30,
				"teacher-pool":           67.80,
			},
		}),
	}
	return
}
