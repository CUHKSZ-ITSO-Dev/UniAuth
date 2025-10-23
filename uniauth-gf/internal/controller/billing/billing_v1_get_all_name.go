package billing

import (
	"context"

	v1 "uniauth-gf/api/billing/v1"
	"uniauth-gf/internal/dao"

	"github.com/gogf/gf/v2/errors/gerror"
)

// GetAllName 获取指定类型的名称列表
func (c *ControllerV1) GetAllName(ctx context.Context, req *v1.GetAllNameReq) (res *v1.GetAllNameRes, err error) {
	res = &v1.GetAllNameRes{}

	// 输入验证
	if req.Name == "" {
		return nil, gerror.New("名称类型不能为空")
	}

	// 字段映射（防止SQL注入）
	fieldMap := map[string]string{
		"service":   "svc",
		"quotaPool": "source", // 注意：数据库字段是 source
		"product":   "product",
	}

	field, exists := fieldMap[req.Name]
	if !exists {
		return nil, gerror.New("不支持的名称类型: " + req.Name)
	}

	// 查询指定字段的所有不重复值
	names, err := c.queryDistinctNames(ctx, field)
	if err != nil {
		return nil, gerror.Wrap(err, "查询名称失败")
	}

	res.Name = names
	return res, nil
}

// queryDistinctNames 查询指定字段的所有不重复值
func (c *ControllerV1) queryDistinctNames(ctx context.Context, field string) ([]string, error) {
	// 使用预编译查询（更安全）
	var names []string
	err := dao.BillingCostRecords.Ctx(ctx).
		Fields("DISTINCT " + field).
		Where(field + " IS NOT NULL AND " + field + " != ''").
		Scan(&names)

	if err != nil {
		return nil, err
	}

	return names, nil
}
