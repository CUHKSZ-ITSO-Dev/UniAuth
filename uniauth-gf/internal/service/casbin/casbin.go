package casbin

import (
	"context"
	"uniauth-gf/internal/dao"
	"uniauth-gf/internal/model/entity"

	psqlwatcher "github.com/IguteChung/casbin-psql-watcher"
	pgadapter "github.com/casbin/casbin-pg-adapter"

	"github.com/casbin/casbin/v2"
	"github.com/casbin/casbin/v2/model"

	"github.com/gogf/gf/v2/errors/gerror"
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

func SyncAutoQuotaPoolCasbinRules(ctx context.Context, ruleNames []string) error {
	type CasbinRule struct {
		Obj string `json:"obj" dc:"资源对象"`
		Act string `json:"act" dc:"动作"`
		Eft string `json:"eft" dc:"效果"`
	}

	for _, ruleName := range ruleNames {
		// 1. 删除指定规则名称的所有现有策略
		subject := "auto_qp_" + ruleName
		if removed, err := e.RemoveFilteredPolicy(0, subject); err != nil {
			return gerror.Wrapf(err, "删除自动配额池规则 %s 的现有策略失败", ruleName)
		} else if removed {
			g.Log().Infof(ctx, "成功删除了自动配额池规则 %s 的现有策略", ruleName)
		} else {
			g.Log().Infof(ctx, "自动配额池规则 %s 没有现有策略需要删除", ruleName)
		}
	}

	// 2. 查询指定的自动配额池规则
	var autoQuotaPoolList []*entity.ConfigAutoQuotaPool
	if err := dao.ConfigAutoQuotaPool.Ctx(ctx).
		WhereIn("rule_name", ruleNames).
		Scan(&autoQuotaPoolList); err != nil {
		return gerror.Wrapf(err, "查询自动配额池规则失败: %v", ruleNames)
	}

	// 3. 收集所有需要添加的casbin策略
	var allPolicies [][]string

	for _, config := range autoQuotaPoolList {
		if config.DefaultCasbinRules == nil {
			continue
		}
		var casbinRules []CasbinRule
		if err := config.DefaultCasbinRules.Scan(&casbinRules); err != nil {
			return gerror.Wrapf(err, "解析自动配额池规则 %s 的 default_casbin_rules 失败", config.RuleName)
		}

		// 为每个规则生成casbin策略
		for _, rule := range casbinRules {
			// 构建casbin策略: p, auto_qp_{rule_name}, {resource}, {action}, {effect}
			policy := []string{
				"auto_qp_" + config.RuleName, // subject
				rule.Obj,                     // object (resource)
				rule.Act,                     // action
				rule.Eft,                     // effect
			}
			allPolicies = append(allPolicies, policy)
		}
	}

	// 4. 添加新策略
	if len(allPolicies) == 0 {
		g.Log().Infof(ctx, "没有策略需要添加")
		return nil
	}
	if added, err := e.AddPolicies(allPolicies); err != nil {
		return gerror.Wrapf(err, "添加casbin策略失败: %v", allPolicies)
	} else if added {
		g.Log().Infof(ctx, "成功添加了 %d 条casbin策略", len(allPolicies))
	} else {
		g.Log().Infof(ctx, "没有新策略需要添加")
	}

	return nil
}
