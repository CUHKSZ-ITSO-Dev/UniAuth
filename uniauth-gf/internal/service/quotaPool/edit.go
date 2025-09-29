package quotaPool

import (
	"context"

	v1 "uniauth-gf/api/userinfos/v1"
	"uniauth-gf/internal/controller/userinfos"
	"uniauth-gf/internal/dao"
	"uniauth-gf/internal/model/entity"
	"uniauth-gf/internal/service/casbin"

	"github.com/gogf/gf/v2/database/gdb"
	"github.com/gogf/gf/v2/errors/gerror"
	"github.com/gogf/gf/v2/frame/g"
	"github.com/robfig/cron/v3"
)

// 编辑配额池，一站式完成配额池的更新，包括配额池信息、Casbin 规则
func Edit(ctx context.Context, quotaPoolInfo *entity.QuotapoolQuotaPool) (err error) {
	// 校验 Cron 表达式
	if _, cronErr := cron.ParseStandard(quotaPoolInfo.CronCycle); cronErr != nil {
		err = gerror.Newf("cronCycle 无效: %v", cronErr)
		return
	}

	err = dao.QuotapoolQuotaPool.Transaction(ctx, func(ctx context.Context, tx gdb.TX) (err error) {
		// 更新配额池信息
		if _, err := dao.QuotapoolQuotaPool.Ctx(ctx).Where("quota_pool_name = ?", quotaPoolInfo.QuotaPoolName).Data(quotaPoolInfo).Update(); err != nil {
			return gerror.Wrap(err, "修改配额池失败")
		}

		// 对比 Casbin 规则，并作更改
		// 获取老的配额池映射规则
		e := casbin.GetEnforcer()
		userUpns, err := e.GetUsersForRole(quotaPoolInfo.QuotaPoolName)
		if err != nil {
			return gerror.Wrap(err, "查询配额池用户组规则失败")
		}
		oldUpnsMap := g.MapStrBool{}
		for _, upn := range userUpns {  // 建索引
			oldUpnsMap[upn] = true
		}
		// 获取更新后的配额池对应哪些用户
		var filter *v1.FilterGroup
		if err = quotaPoolInfo.UserinfosRules.Scan(&filter); err != nil {
			return gerror.Wrap(err, "解析当前配额池 UserinfosRules 失败")
		}
		filterRes, err := userinfos.NewV1().Filter(ctx, &v1.FilterReq{
			Filter:  filter,
			Verbose: false,
		})
		if err != nil {
			return gerror.Wrap(err, "根据 UserinfosRules 筛选用户失败")
		}
		newUpnsMap := g.MapStrBool{}
		for _, upn := range filterRes.UserUpns {  // 建索引
			newUpnsMap[upn] = true
		}
		// 老的有，新的有，不处理
		// 老的没有，新的有，添加
		// 老的有，新的没有，删除
		var policiesToAdd [][]string
		for _, upn := range filterRes.UserUpns {
			if _, ok := oldUpnsMap[upn]; !ok {
				// 老的没有，新的有，要添加
				policiesToAdd = append(policiesToAdd, []string{upn, quotaPoolInfo.QuotaPoolName})
			}
		}
		if _, addErr := e.AddGroupingPolicies(policiesToAdd); addErr != nil {
			return gerror.Wrapf(addErr, "添加配额池用户组继承关系失败: %v", policiesToAdd)
		}
		var policiesToDelete [][]string
		for _, upn := range userUpns {
			if _, ok := newUpnsMap[upn]; !ok {
				// 老的有，新的没有，要删除
				policiesToDelete = append(policiesToDelete, []string{upn, quotaPoolInfo.QuotaPoolName})
			}
		}
		if _, delErr := e.RemoveGroupingPolicies(policiesToDelete); delErr != nil {
			return gerror.Wrapf(delErr, "删除配额池用户组继承关系失败: %v", policiesToDelete)
		}
		if err = e.SavePolicy(); err != nil {
			return gerror.Wrap(err, "Casbin 保存配额池用户组继承关系失败")
		}
		return nil
	})
	if err != nil {
		return gerror.Wrapf(err, "修改配额池 %v 事务失败", quotaPoolInfo.QuotaPoolName)
	}
	return nil
}
