package billing

import (
	"context"
	"sort"

	v1 "uniauth-gf/api/billing/v1"

	"github.com/gogf/gf/v2/encoding/gjson"
	"github.com/gogf/gf/v2/errors/gerror"
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

		// 按产品分组
		dateMap[item.Date][item.Product] += item.Calls
	}

	// 构建系列数据
	series := make([]map[string]interface{}, 0)
	productMap := make(map[string]bool)

	// 收集所有产品
	for _, dateData := range dateMap {
		for product := range dateData {
			productMap[product] = true
		}
	}

	// 为每个产品创建系列
	for product := range productMap {
		seriesData := make([]int, len(dates))
		for i, date := range dates {
			if dateData, exists := dateMap[date]; exists {
				seriesData[i] = dateData[product]
			}
		}

		series = append(series, map[string]interface{}{
			"name": product,
			"data": seriesData,
		})
	}

	// 排序日期
	sort.Strings(dates)

	return gjson.New(map[string]interface{}{
		"dates":  dates,
		"series": series,
	})
}

// buildBarChartData 构建条形图数据
func (c *ControllerV1) buildBarChartData(consumption []v1.ConsumptionItem) *gjson.Json {
	// 按产品分组统计总调用次数
	productMap := make(map[string]int)

	for _, item := range consumption {
		productMap[item.Product] += item.Calls
	}

	// 构建标签和数据
	labels := make([]string, 0, len(productMap))
	data := make([]int, 0, len(productMap))

	for product, calls := range productMap {
		labels = append(labels, product)
		data = append(data, calls)
	}

	return gjson.New(map[string]interface{}{
		"labels": labels,
		"data":   data,
	})
}
