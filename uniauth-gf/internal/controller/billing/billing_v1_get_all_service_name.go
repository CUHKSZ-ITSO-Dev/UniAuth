package billing

import (
	"context"
	"uniauth-gf/internal/dao"

	"github.com/gogf/gf/v2/errors/gerror"

	"uniauth-gf/api/billing/v1"
)

// GetAllServiceName 独立实现返回所有服务名称
func (c *ControllerV1) GetAllServiceName(ctx context.Context, req *v1.GetAllServiceNameReq) (res *v1.GetAllServiceNameRes, err error) {

	var serviceNames []string
	err = dao.BillingCostRecords.Ctx(ctx).
		Fields("DISTINCT svc").
		Where("svc IS NOT NULL AND svc != ''").
		Order("svc ASC").
		Scan(&serviceNames)

	if err != nil {
		return nil, gerror.Wrap(err, "查询服务名称失败")
	}

	if serviceNames == nil || len(serviceNames) == 0 {
		serviceNames = []string{}
	}

	res = &v1.GetAllServiceNameRes{
		ServiceName: serviceNames,
	}
	return res, nil
}
