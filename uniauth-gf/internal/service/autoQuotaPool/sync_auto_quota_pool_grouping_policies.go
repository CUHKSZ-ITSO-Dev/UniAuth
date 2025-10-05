package autoQuotaPool

import (
	"context"

	"github.com/gogf/gf/v2/database/gdb"
	"github.com/gogf/gf/v2/errors/gerror"

	"uniauth-gf/internal/dao"
	"uniauth-gf/internal/model/entity"
	"uniauth-gf/internal/service/casbin"
)

func SyncAutoQuotaPoolGroupingPolicies(ctx context.Context, ruleNames []string) error {
	e := casbin.GetEnforcer()

	return dao.ConfigAutoQuotaPool.Transaction(ctx, func(txCtx context.Context, _ gdb.TX) error {
		// 1. 查询自动配额池配置
		var poolList []*entity.ConfigAutoQuotaPool
		if err := dao.ConfigAutoQuotaPool.Ctx(txCtx).
			WhereIn("rule_name", ruleNames).
			LockUpdate().
			Scan(&poolList); err != nil {
			return gerror.Wrapf(err, "查询自动配额池配置失败: %v", ruleNames)
		}
		if len(poolList) == 0 {
			return nil
		}

		type poolContext struct {
			autoRole       string
			targetSubjects map[string]struct{}
		}

		// 2. 构建角色和主体映射
		poolMap := make(map[string]*poolContext, len(poolList))
		autoRoles := make([]string, 0, len(poolList))
		for _, pool := range poolList {
			autoRole := "auto_qp_" + pool.RuleName
			ctx := &poolContext{
				autoRole:       autoRole,
				targetSubjects: make(map[string]struct{}, len(pool.UpnsCache)),
			}
			for _, upn := range pool.UpnsCache {
				subject := "personal-" + upn
				ctx.targetSubjects[subject] = struct{}{}
			}
			poolMap[autoRole] = ctx
			autoRoles = append(autoRoles, autoRole)
		}

		// 3. 查询现有Casbin分组策略
		existingSubjectsByRole := make(map[string]map[string]struct{}, len(autoRoles))
		if len(autoRoles) > 0 {
			for _, role := range autoRoles {
				users, err := e.GetUsersForRole(role)
				if err != nil {
					return gerror.Wrapf(err, "查询角色 %s 的用户失败", role)
				}
				existingSubjectsByRole[role] = make(map[string]struct{}, len(users))
				for _, user := range users {
					existingSubjectsByRole[role][user] = struct{}{}
				}
			}
			totalSubjects := 0
			for _, subjects := range existingSubjectsByRole {
				totalSubjects += len(subjects)
			}
		}

		var policiesToAdd [][]string
		var policiesToRemove [][]string

		// 4. 计算策略差异
		for role, ctx := range poolMap {
			existingSubjects := existingSubjectsByRole[role]
			if existingSubjects == nil {
				existingSubjects = map[string]struct{}{}
			}
			for subject := range ctx.targetSubjects {
				if _, ok := existingSubjects[subject]; !ok {
					policiesToAdd = append(policiesToAdd, []string{subject, role})
				}
			}
			for subject := range existingSubjects {
				if _, ok := ctx.targetSubjects[subject]; !ok {
					policiesToRemove = append(policiesToRemove, []string{subject, role})
				}
			}
		}

		// 5. 批量更新Casbin策略
		if len(policiesToAdd) > 0 {
			if _, err := e.AddGroupingPolicies(policiesToAdd); err != nil {
				return gerror.Wrap(err, "批量新增 Casbin 分组失败")
			}
		}
		if len(policiesToRemove) > 0 {
			if _, err := e.RemoveGroupingPolicies(policiesToRemove); err != nil {
				return gerror.Wrap(err, "批量删除 Casbin 分组失败")
			}
		}
		return nil
	})
}
