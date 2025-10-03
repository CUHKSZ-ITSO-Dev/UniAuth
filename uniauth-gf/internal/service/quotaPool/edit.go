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
	"github.com/gogf/gf/v2/util/gconv"

	"github.com/robfig/cron/v3"
)

// 编辑配额池，一站式完成配额池的更新，包括配额池信息、Casbin 规则。
//
// editInfo 仅需传递需要改动的字段和内容。其中 quotaPoolName 为必传字段。
func Edit(ctx context.Context, editInfo g.Map) (err error) {
	quotaPoolName, ok := editInfo["quotaPoolName"]
	if !ok {
		return gerror.New("quotaPoolName 不能为空")
	}
	// 校验 Cron 表达式
	cronExpr, ok := editInfo["cronCycle"]
	if ok {
		if _, cronErr := cron.ParseStandard(cronExpr.(string)); cronErr != nil {
			err = gerror.Newf("cronCycle 无效: %v", cronErr)
			return
		}
	}

	err = dao.QuotapoolQuotaPool.Transaction(ctx, func(ctx context.Context, tx gdb.TX) (err error) {
		var quotaPoolInfo entity.QuotapoolQuotaPool
		if err = dao.QuotapoolQuotaPool.Ctx(ctx).Where("quota_pool_name = ?", quotaPoolName).LockUpdate().Scan(&quotaPoolInfo); err != nil {
			return gerror.Wrap(err, "查询配额池信息失败")
		}
		// 将 editInfo 中的字段更新到 quotaPoolInfo
		if err = gconv.Struct(editInfo, &quotaPoolInfo); err != nil {
			return gerror.Wrap(err, "更新配额池信息失败")
		}
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
		for _, upn := range userUpns { // 建索引
			oldUpnsMap[upn] = true
		}
		// 获取更新后的配额池对应哪些用户
		var filter *v1.FilterGroup
		if err = quotaPoolInfo.UserinfosRules.Scan(&filter); err != nil {
			return gerror.Wrap(err, "解析当前配额池 UserinfosRules 失败")
		}
		var userUpnsNew []string
		if isUserinfosFilterEmpty(filter) {
			userUpnsNew = []string{}
		} else {
			filterRes, ferr := userinfos.NewV1().Filter(ctx, &v1.FilterReq{
				Filter:  filter,
				Verbose: false,
				Pagination: &v1.PaginationReq{
					All: true,
				},
			})
			if ferr != nil {
				return gerror.Wrap(ferr, "根据 UserinfosRules 筛选用户失败")
			}
			userUpnsNew = filterRes.UserUpns
		}
		newUpnsMap := g.MapStrBool{}
		for _, upn := range userUpnsNew { // 建索引
			newUpnsMap[upn] = true
		}
		// 老的有，新的有，不处理
		// 老的没有，新的有，添加
		var policiesToAdd [][]string
		for _, upn := range userUpnsNew {
			if _, ok := oldUpnsMap[upn]; !ok {
				// 老的没有，新的有，要添加
				policiesToAdd = append(policiesToAdd, []string{upn, quotaPoolInfo.QuotaPoolName})
			}
		}
		if len(policiesToAdd) != 0 {
			if _, addErr := e.AddGroupingPolicies(policiesToAdd); addErr != nil {
				return gerror.Wrapf(addErr, "添加配额池用户组继承关系失败: %v", policiesToAdd)
			}
		}
		// 老的有，新的没有，删除
		var policiesToDelete [][]string
		for _, upn := range userUpns {
			if _, ok := newUpnsMap[upn]; !ok {
				// 老的有，新的没有，要删除
				policiesToDelete = append(policiesToDelete, []string{upn, quotaPoolInfo.QuotaPoolName})
			}
		}
		if len(policiesToDelete) != 0 {
			if _, delErr := e.RemoveGroupingPolicies(policiesToDelete); delErr != nil {
				return gerror.Wrapf(delErr, "删除配额池用户组继承关系失败: %v", policiesToDelete)
			}
		}
		return nil
	})
	if err != nil {
		return gerror.Wrapf(err, "修改配额池 %v 事务失败", quotaPoolName)
	}
	return nil
}
