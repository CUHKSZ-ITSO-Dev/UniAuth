package exchangeRate

import (
	"context"
	"encoding/json"
	"time"
	"uniauth-gf/internal/dao"

	"golang.org/x/sync/singleflight"

	"github.com/gogf/gf/v2/errors/gerror"
	"github.com/gogf/gf/v2/frame/g"
	"github.com/gogf/gf/v2/os/gtime"
	"github.com/shopspring/decimal"
)

func GetExchangeRate(ctx context.Context, f string, t string) (decimal.Decimal, error) {
	rateRaw, err := g.DB().GetValue(ctx, "SELECT rate FROM config_exchange_rate WHERE f = ? AND t = ? AND date = ?", f, t, gtime.Date())
	if err != nil {
		return decimal.Zero, err
	}
	if !rateRaw.IsNil() {
		rate, err := decimal.NewFromString(rateRaw.String())
		if err != nil {
			return decimal.Zero, err
		}
		return rate, nil
	}

	// 走到这里说明数据库里面没有汇率数据，需要请求API
	// 使用 singleflight 解决并发竞争问题
	g := new(singleflight.Group)
	v, err, _ := g.Do("getRateApi", func() (interface{}, error) {
		rate, err := getRateApi(ctx)
		if err != nil {
			return decimal.Zero, err
		}
		return rate, nil
	})
	if err != nil {
		return decimal.Zero, err
	}
	return v.(decimal.Decimal), nil
}

func getRateApi(ctx context.Context) (decimal.Decimal, error) {
	r := g.Client().Timeout(time.Duration(3*1000*1000*1000)).GetBytes(ctx, "https://v6.exchangerate-api.com/v6/badaf9f96a065fc7b17b662d/latest/USD")
	var rJson g.Map
	if err := json.Unmarshal(r, &rJson); err != nil {
		return decimal.Zero, err
	}
	result, ok := rJson["result"].(string)
	if !ok || result != "success" {
		return decimal.Zero, gerror.New("汇率 API 接口返回的 result 不是 success，API 接口异常。")
	}
	rate, ok := rJson["conversion_rates"].(g.Map)["CNY"].(float64)
	if !ok {
		return decimal.Zero, gerror.New("汇率 API 接口返回的 CNY 汇率不是 float64 或者没有返回，API 接口异常。")
	}

	// 数据库写入
	_, err := dao.ConfigExchangeRate.Ctx(ctx).Data(g.Map{
		"date": gtime.Date(),
		"f":    "USD",
		"t":    "CNY",
		"rate": decimal.NewFromFloat(rate),
	}).Insert()
	if err != nil {
		return decimal.Zero, gerror.Wrap(err, "数据库汇率写入失败")
	}

	return decimal.NewFromFloat(rate), nil
}
