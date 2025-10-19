package billing

import (
	"context"

	"github.com/gogf/gf/v2/encoding/gjson"

	v1 "uniauth-gf/api/billing/v1"
)

func (c *ControllerV1) DepartmentQuestionCountStats(ctx context.Context, req *v1.DepartmentQuestionCountStatsReq) (res *v1.DepartmentQuestionCountStatsRes, err error) {

	res = &v1.DepartmentQuestionCountStatsRes{
		QuestionCountStats: gjson.New(map[string]interface{}{
			"2025-10-19": map[string]interface{}{
				"SDS": 45,
				"SME": 32,
				"SSE": 28,
			},
		}),
	}

	return
}
