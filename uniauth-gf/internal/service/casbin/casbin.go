package casbin

import (
	psqlwatcher "github.com/IguteChung/casbin-psql-watcher"
	pgadapter "github.com/casbin/casbin-pg-adapter"

	"context"

	"github.com/casbin/casbin/v2"
	"github.com/casbin/casbin/v2/model"

	"github.com/gogf/gf/v2/frame/g"
	"github.com/gogf/gf/v2/os/gctx"
	"github.com/gogf/gf/v2/os/gres"
)

var e *casbin.Enforcer

func init() {
	// 从gres中读取Casbin配置文件
	configFile := gres.Get("resource/config/core_rbac.conf")
	if configFile == nil {
		panic("未找到Casbin配置文件: resource/config/core_rbac.conf")
	}
	configContent := configFile.Content()
	m, err := model.NewModelFromString(string(configContent))
	if err != nil {
		panic("解析Casbin配置文件失败: " + err.Error())
	}

	ctx := gctx.New()

	// Watcher 配置
	conn := g.Cfg().MustGetWithEnv(ctx, "casbin.default.watcher").String()
    w, err := psqlwatcher.NewWatcherWithConnString(ctx, conn,
		psqlwatcher.Option{Verbose: g.Cfg().MustGet(ctx, "casbin.default.watcher.verbose", false).Bool()})
	if err != nil {
		panic("创建Casbin Watcher失败: " + err.Error())
	}

	// 数据库连接配置
	dsn := g.Cfg().MustGetWithEnv(ctx, "casbin.default.link")
	dbn := g.Cfg().MustGetWithEnv(ctx, "casbin.default.database")
	a, err := pgadapter.NewAdapter(dsn.String(), dbn.String())
	if err != nil {
		panic("创建Casbin适配器失败: " + err.Error())
	}

	// 使用model和adapter创建Enforcer
	e, err = casbin.NewEnforcer(m, a)
	if err != nil {
		panic("创建Casbin Enforcer失败: " + err.Error())
	}

	// Watcher
	// 设置 Watcher
	if err := e.SetWatcher(w); err != nil {
		panic("设置Casbin Watcher失败: " + err.Error())
	}
	// Watcher 回调处理函数
	if err := w.SetUpdateCallback(psqlwatcher.DefaultCallback(e)); err != nil {
		panic("设置Casbin Watcher回调处理函数失败: " + err.Error())
	}

	// 加载策略
	if err := e.LoadPolicy(); err != nil {
		panic("加载Casbin策略失败: " + err.Error())
	}
}

func GetEnforcer() *casbin.Enforcer {
	return e
}
