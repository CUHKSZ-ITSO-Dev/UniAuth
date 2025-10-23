package billing

import (
	"context"
	"sort"

	"github.com/gogf/gf/v2/encoding/gjson"
	"github.com/gogf/gf/v2/errors/gerror"

	v1 "uniauth-gf/api/billing/v1"
)

func (c *ControllerV1) GetProductUsageChart(ctx context.Context, req *v1.GetProductUsageChartReq) (res *v1.GetProductUsageChartRes, err error) {
	// 调用基础接口获取数据
	consumptionReq := &v1.GetProductConsumptionReq{
		NDays:     req.NDays,
		Service:   req.Service,
		QuotaPool: req.QuotaPool,
		Product:   req.Product,
	}

	consumptionRes, err := c.GetProductConsumption(ctx, consumptionReq)
	if err != nil {
		return nil, gerror.Wrap(err, "获取消费数据失败")
	}

	// 转换为图表格式
	res = &v1.GetProductUsageChartRes{
		LineChartData: c.buildLineChartData(consumptionRes.Consumption),
		BarChartData:  c.buildBarChartData(consumptionRes.Consumption),
		TotalCalls:    consumptionRes.TotalCalls,
	}

	return res, nil
}

// buildLineChartData 构建折线图数据
func (c *ControllerV1) buildLineChartData(consumption []v1.ConsumptionItem) *gjson.Json {
	// 按日期分组
	dateMap := make(map[string]map[string]int)
	dates := make([]string, 0)

	for _, item := range consumption {
		if item.Date == "" {
			continue
		}

		// 确保日期在map中
		if _, exists := dateMap[item.Date]; !exists {
			dateMap[item.Date] = make(map[string]int)
			dates = append(dates, item.Date)
		}

		// 累加调用次数
		dateMap[item.Date][item.Product] += item.Calls
	}

	// 排序日期
	sort.Strings(dates)

	// 获取所有产品
	productSet := make(map[string]bool)
	for _, item := range consumption {
		if item.Product != "" {
			productSet[item.Product] = true
		}
	}

	// 构建系列数据
	series := make([]map[string]interface{}, 0)
	for product := range productSet {
		seriesItem := map[string]interface{}{
			"name": product,
			"data": make([]int, len(dates)),
		}

		for i, date := range dates {
			if calls, exists := dateMap[date][product]; exists {
				seriesItem["data"].([]int)[i] = calls
			}
		}

		series = append(series, seriesItem)
	}

	result := map[string]interface{}{
		"dates":  dates,
		"series": series,
	}

	return gjson.New(result)
}

// buildBarChartData 构建条形图数据
func (c *ControllerV1) buildBarChartData(consumption []v1.ConsumptionItem) *gjson.Json {
	// 按产品分组
	productMap := make(map[string]int)

	for _, item := range consumption {
		if item.Product != "" {
			productMap[item.Product] += item.Calls
		}
	}

	// 转换为数组格式
	labels := make([]string, 0, len(productMap))
	data := make([]int, 0, len(productMap))

	for product, calls := range productMap {
		labels = append(labels, product)
		data = append(data, calls)
	}

	result := map[string]interface{}{
		"labels": labels,
		"data":   data,
	}

	return gjson.New(result)
}
