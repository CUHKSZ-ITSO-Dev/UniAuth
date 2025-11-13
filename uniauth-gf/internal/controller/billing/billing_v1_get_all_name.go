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
		"quotaPool": "source",
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
	// 使用Array()方法获取字符串数组
	result, err := dao.BillingCostRecords.Ctx(ctx).
		Fields(field).
		Where(field + " IS NOT NULL AND " + field + " != ''").
		Distinct().
		Array()

	if err != nil {
		return nil, err
	}

	// 转换为字符串数组
	names := make([]string, 0, len(result)+1)
	names = append(names, "all")
	for _, item := range result {
		if str := item.String(); str != "" {
			names = append(names, str)
		}
	}

	return names, nil
}
