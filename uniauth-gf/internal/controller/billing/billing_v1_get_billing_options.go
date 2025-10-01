package billing

import (
	"context"

	v1 "uniauth-gf/api/billing/v1"
	"uniauth-gf/internal/dao"

	"github.com/gogf/gf/v2/frame/g"
)

func (c *ControllerV1) GetBillingOptions(ctx context.Context, req *v1.GetBillingOptionsReq) (res *v1.GetBillingOptionsRes, err error) {
	// 查询该配额池的所有唯一服务类型
	servicesArray, err := dao.BillingCostRecords.Ctx(ctx).
		Fields("svc").
		Distinct().
		Where("source = ?", req.QuotaPool).
		Array()
	if err != nil {
		g.Log().Error(ctx, "查询服务类型失败:", err)
		return nil, err
	}

	// 查询该配额池的所有唯一产品类型
	productsArray, err := dao.BillingCostRecords.Ctx(ctx).
		Fields("product").
		Distinct().
		Where("source = ?", req.QuotaPool).
		Array()
	if err != nil {
		g.Log().Error(ctx, "查询产品类型失败:", err)
		return nil, err
	}

	// 转换为字符串切片
	services := make([]string, len(servicesArray))
	for i, service := range servicesArray {
		services[i] = service.String()
	}

	products := make([]string, len(productsArray))
	for i, product := range productsArray {
		products[i] = product.String()
	}

	res = &v1.GetBillingOptionsRes{
		Services: services,
		Products: products,
	}

	return res, nil
}
