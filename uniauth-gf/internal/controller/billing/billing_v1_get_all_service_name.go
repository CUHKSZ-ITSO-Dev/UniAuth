package billing

import (
	"context"

	v1 "uniauth-gf/api/billing/v1"
	"uniauth-gf/internal/dao"

	"github.com/gogf/gf/v2/errors/gerror"
)

func (c *ControllerV1) GetAllServiceName(ctx context.Context, req *v1.GetAllServiceNameReq) (res *v1.GetAllServiceNameRes, err error) {
	res = &v1.GetAllServiceNameRes{}

	// 查询所有不重复的服务名称
	serviceNames, err := dao.BillingCostRecords.Ctx(ctx).
		Fields("DISTINCT svc").
		Where("svc IS NOT NULL AND svc != ''").
		Array()
	if err != nil {
		return nil, gerror.Wrap(err, "查询服务名称失败")
	}

	// 转换为字符串数组
	res.ServiceName = make([]string, 0, len(serviceNames))
	for _, name := range serviceNames {
		res.ServiceName = append(res.ServiceName, name.String())
	}
	return res, nil
}
