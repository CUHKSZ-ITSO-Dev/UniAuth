package cmd

import (
	"context"
	"fmt"
	_ "time/tzdata"

	"github.com/gogf/gf/v2/os/gcron"
	"github.com/gogf/gf/v2/os/gtime"

	"github.com/gogf/gf/v2/frame/g"
	"github.com/gogf/gf/v2/net/ghttp"
	"github.com/gogf/gf/v2/os/gcmd"

	"uniauth-gf/internal/controller/auth"
	"uniauth-gf/internal/controller/billing"
	"uniauth-gf/internal/controller/config"
	"uniauth-gf/internal/controller/quotaPool"
	"uniauth-gf/internal/controller/userinfos"
	quotaPoolSvc "uniauth-gf/internal/service/quotaPool"

	"uniauth-gf/internal/middlewares"
)

var (
	Main = gcmd.Command{
		Name:  "main",
		Usage: "main",
		Brief: "start http server",
		Func: func(ctx context.Context, parser *gcmd.Parser) (err error) {
			fmt.Println(`
   __  __      _ ___         __  __  
  ╱ ╱ ╱ ╱___  (_)   │ __  __╱ ╱_╱ ╱_ 
 ╱ ╱ ╱ ╱ __ ╲╱ ╱ ╱│ │╱ ╱ ╱ ╱ __╱ __ ╲
╱ ╱_╱ ╱ ╱ ╱ ╱ ╱ ___ ╱ ╱_╱ ╱ ╱_╱ ╱ ╱ ╱
╲____╱_╱ ╱_╱_╱_╱  │_╲__,_╱╲__╱_╱ ╱_╱ 
			`)
			fmt.Println("UniAuth Automated System")
			fmt.Println("Copyright 2025 The Chinese University of Hong Kong, Shenzhen")
			fmt.Println()
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

			// 注册定时任务
			if _, err = gcron.Add(ctx, "@daily", func(ctx context.Context) {
				if err := quotaPoolSvc.UpdateQuotaPoolsUsersInCasbin(ctx, nil); err != nil {
					g.Log().Error(ctx, "定时任务执行失败:", err)
				}
			}, "Update QuotaPools Users in Casbin"); err != nil {
				// 注册失败
				panic(err)
			}
			return nil
		},
	}
)
