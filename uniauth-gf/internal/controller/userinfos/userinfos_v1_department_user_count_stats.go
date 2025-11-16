package userinfos

import (
	"context"
	"strings"

	"github.com/gogf/gf/v2/encoding/gjson"
	"github.com/gogf/gf/v2/errors/gerror"

	v1 "uniauth-gf/api/userinfos/v1"
	"uniauth-gf/internal/dao"
)

func (c *ControllerV1) DepartmentUserCountStats(ctx context.Context, req *v1.DepartmentUserCountStatsReq) (res *v1.DepartmentUserCountStatsRes, err error) {
	departmentColumn := dao.UserinfosUserInfos.Columns().Department

	result, err := dao.UserinfosUserInfos.Ctx(ctx).
		Fields(departmentColumn+" AS department", "COUNT(*) AS count").
		Group(departmentColumn).
		All()
	if err != nil {
		return nil, gerror.Wrap(err, "查询部门用户统计失败")
	}

	departmentStats := make(map[string]int64, len(result))
	for _, record := range result {
		department := strings.TrimSpace(record["department"].String())
		if department == "" {
			department = "Unknown"
		}
		departmentStats[department] = record["count"].Int64()
	}

	res = &v1.DepartmentUserCountStatsRes{
		DepartmentStats: gjson.New(departmentStats),
	}
	return
}
