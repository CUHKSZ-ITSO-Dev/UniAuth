package quotaPool

import (
	"context"
	"uniauth-gf/internal/dao"

	"github.com/gogf/gf/v2/database/gdb"
	"github.com/gogf/gf/v2/errors/gerror"
	"github.com/gogf/gf/v2/frame/g"
)

// UpdateQuotaPoolsUsersInCasbin 用于根据配额池名称列表，刷新对应配额池的用户组在 Casbin 中的继承关系。
//
// 如果 qpNameList 传递 nil，则刷新所有配额池；如果传递空数组，则不进行任何操作。
func UpdateQuotaPoolsUsersInCasbin(ctx context.Context, qpNameList *[]string) error {
	if err := dao.QuotapoolQuotaPool.Transaction(ctx, func(ctx context.Context, tx gdb.TX) error {
		var qps []g.Map
		db := dao.QuotapoolQuotaPool.Ctx(ctx).LockUpdate()
		if qpNameList == nil {
			if err := db.Scan(&qps); err != nil {
				return gerror.Wrap(err, "查询所有配额池失败")
			}
		} else {
			if len(*qpNameList) == 0 {
				return nil // 列表为空，无需操作
			}
			if err := db.WhereIn(dao.QuotapoolQuotaPool.Columns().QuotaPoolName, *qpNameList).Scan(&qps); err != nil {
				return gerror.Wrap(err, "查询指定配额池失败")
			}
			if len(qps) == 0 {
				return gerror.New("找不到任何指定的配额池")
			}
		}
		for _, qp := range qps {
			if err := Edit(ctx, qp); err != nil {
				return gerror.Wrapf(err, "更新配额池 %v 失败", qp["QuotaPoolName"])
			}
		}
		return nil
	}); err != nil {
		return gerror.Wrap(err, "更新配额池用户组继承关系事务失败")
	}
	return nil
}
