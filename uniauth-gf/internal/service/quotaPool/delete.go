package quotaPool

import (
	"context"

	"github.com/gogf/gf/v2/database/gdb"
	"github.com/gogf/gf/v2/errors/gcode"
	"github.com/gogf/gf/v2/errors/gerror"

	"uniauth-gf/internal/dao"
	"uniauth-gf/internal/service/casbin"
)

func Delete(ctx context.Context, quotaPoolName string) error {
	err := dao.QuotapoolQuotaPool.Transaction(ctx, func(ctx context.Context, tx gdb.TX) error {
		if sqlRes, delErr := dao.QuotapoolQuotaPool.Ctx(ctx).Where("quota_pool_name = ?", quotaPoolName).Delete(); delErr != nil {
			return gerror.WrapCode(gcode.CodeDbOperationError, delErr, "删除配额池失败")
		} else if eftRow, err := sqlRes.RowsAffected(); eftRow == 0 {
			return gerror.New("找不到配额池。数据库影响行数为0。")
		} else if err != nil {
			return gerror.WrapCode(gcode.CodeDbOperationError, err, "检查配额池删除情况失败")
		}

		// 清理 Casbin 中的相关规则
		e := casbin.GetEnforcer()
		// 获取该配额池的所有用户映射关系
		userUpns, err := e.GetUsersForRole(quotaPoolName)
		if err != nil {
			return gerror.Wrap(err, "查询配额池用户组规则失败")
		}
		// 删除所有用户到该配额池的映射关系
		if len(userUpns) > 0 {
			var policiesToDelete [][]string
			for _, upn := range userUpns {
				policiesToDelete = append(policiesToDelete, []string{upn, quotaPoolName})
			}

			if _, err := e.RemoveGroupingPolicies(policiesToDelete); err != nil {
				return gerror.Wrapf(err, "删除配额池用户组继承关系失败: %v", policiesToDelete)
			}
		}
		return nil
	})

	if err != nil {
		return gerror.Wrapf(err, "删除配额池 %s 事务失败", quotaPoolName)
	}

	return nil
}
