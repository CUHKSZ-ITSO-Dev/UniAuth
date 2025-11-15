package main

import (
	"context"
	"encoding/json"
	"sync"

	"github.com/gogf/gf/v2/errors/gerror"
	"github.com/gogf/gf/v2/frame/g"
	"github.com/gogf/gf/v2/os/gtime"
	"github.com/gogf/gf/v2/util/gconv"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var config Config
var db *gorm.DB

func main() {
	ctx := context.Background()
	if err := gtime.SetTimeZone("Asia/Shanghai"); err != nil {
		g.Log().Fatalf(ctx, "设置时区失败: %v", err)
	}

	// 配置文件校验
	if err := gconv.Struct(g.Cfg("config.yaml").MustData(ctx), &config); err != nil {
		g.Log().Fatalf(ctx, "解析 CONFIG 失败: %v", err)
	}
	// 数据库初始化
	var err error
	db, err = gorm.Open(postgres.Open(config.DSN), &gorm.Config{})
	if err != nil {
		g.Log().Fatalf(ctx, "数据库初始化失败: %v", err)
	}

	wg := sync.WaitGroup{}
	semaphore := make(chan struct{}, config.MAX_CONCURRENT_REQUESTS)

	for _, apiKey := range config.QUERY_API_KEYS {
		wg.Add(1)
		go func(ctx context.Context, apiKey string) {
			defer wg.Done()

			// 获取总量
			client := g.Client().ContentJson().SetHeader("x-api-key", apiKey)
			semaphore <- struct{}{}
			resBytes := client.PostBytes(
				ctx,
				config.USER_QUERY_COUNT_URL,
				g.Map{
					"OperateName":     config.OPERATE_NAME,
					"EncryptPassword": config.ENCRYPT_PASSWORD,
				},
			)
			<-semaphore

			var res UserCount
			if err := json.Unmarshal(resBytes, &res); err != nil {
				g.Log().Error(ctx, gerror.Wrapf(err, "[%s] 解析用户总量查询响应失败", apiKey[:8]))
				return
			}
			if res.Code != 999 {
				g.Log().Error(ctx, gerror.Newf("[%s] 获取用户总量失败服务端返回 code = %d with message = %s", apiKey[:8], res.Code, res.Msg))
				return
			}
			totalCount := res.TotalCount
			totalPage := totalCount/config.PAGE_SIZE + 1

			wgBatch := sync.WaitGroup{}
			for page := 1; page <= totalPage; page++ {
				g.Log().Infof(ctx, "[%s] 正在处理 %d / %d 记录。", apiKey[:8], page, totalPage)
				wgBatch.Add(1)
				go FetchOnePage(ctx, &wgBatch, semaphore, apiKey, page)
			}
			wgBatch.Wait()
		}(ctx, apiKey)
	}
	wg.Wait()
	g.Log().Infof(ctx, "同步数据已完成，开始清理过期数据……")
	rowsAffected, err := gorm.G[UserinfosUserInfos](db).Where("updated_at < ?", gtime.Now().AddDate(0, 0, -30)).Delete(ctx)
	if err != nil {
		g.Log().Error(ctx, gerror.Wrapf(err, "清理过期数据失败"))
		return
	}
	g.Log().Infof(ctx, "清理过期数据完成，共清理 %d 条记录。", rowsAffected)
	g.Log().Infof(ctx, "同步流程结束")
}
