package cmd

import (
	"context"
	_ "time/tzdata"

	"github.com/gogf/gf/v2/os/gtime"

	"github.com/gogf/gf/v2/frame/g"
	"github.com/gogf/gf/v2/net/ghttp"
	"github.com/gogf/gf/v2/os/gcmd"

	"uniauth-gf/internal/controller/auth"
	"uniauth-gf/internal/controller/billing"
	"uniauth-gf/internal/controller/config"
	"uniauth-gf/internal/controller/quotaPool"
	"uniauth-gf/internal/controller/userinfos"
	
    "uniauth-gf/internal/middlewares"
)

var (
	Main = gcmd.Command{
		Name:  "main",
		Usage: "main",
		Brief: "start http server",
		Func: func(ctx context.Context, parser *gcmd.Parser) (err error) {
			// 设置进程全局时区
			if err := gtime.SetTimeZone("Asia/Shanghai"); err != nil {
				panic(err)
			}

			s := g.Server()
			s.Use(middlewares.UniResMiddleware)
			s.Group("/userinfos", func(group *ghttp.RouterGroup) {
				group.Bind(
					userinfos.NewV1(),
				)
			})
			s.Group("/auth", func(group *ghttp.RouterGroup) {
				group.Bind(
					auth.NewV1(),
				)
			})
			s.Group("/billing", func(group *ghttp.RouterGroup) {
				group.Bind(
					billing.NewV1(),
				)
			})
			s.Group("/config", func(group *ghttp.RouterGroup) {
				group.Bind(
					config.NewV1(),
				)
			})
			s.Group("/quotaPool", func(group *ghttp.RouterGroup) {
				group.Bind(
					quotaPool.NewV1(),
				)
			})
			s.SetOpenApiPath(g.Cfg().MustGetWithEnv(ctx, "server.openapiPath").String())
			s.SetSwaggerPath(g.Cfg().MustGetWithEnv(ctx, "server.swaggerPath").String())
			s.SetPort(g.Cfg().MustGetWithEnv(ctx, "server.port").Int())
			s.Run()
			return nil
		},
	}
)
