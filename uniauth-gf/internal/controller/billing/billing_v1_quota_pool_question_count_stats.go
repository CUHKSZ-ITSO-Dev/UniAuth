package billing

import (
	"context"

	v1 "uniauth-gf/api/billing/v1"

	"github.com/gogf/gf/v2/encoding/gjson"
)

func (c *ControllerV1) QuotaPoolQuestionCountStats(ctx context.Context, req *v1.QuotaPoolQuestionCountStatsReq) (res *v1.QuotaPoolQuestionCountStatsRes, err error) {
	res = &v1.QuotaPoolQuestionCountStatsRes{
		QuestionCountStats: gjson.New(map[string]interface{}{
			"2025-10-19": map[string]interface{}{
				"itso-deep-research-vip": 45,
				"student-pool":           32,
				"teacher-pool":           28,
			},
		}),
	}
	return
}
