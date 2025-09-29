package quotaPool

import (
	"context"
	"uniauth-gf/internal/dao"
	"uniauth-gf/internal/model/entity"

	"github.com/gogf/gf/v2/database/gdb"
	"github.com/gogf/gf/v2/errors/gerror"
)

func UpdateQuotaPoolsUsersInCasbin(ctx context.Context, qpNameList *[]string) error {
	if err := dao.QuotapoolQuotaPool.Transaction(ctx, func(ctx context.Context, tx gdb.TX) error {
		var qps []entity.QuotapoolQuotaPool
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
			if err := Edit(ctx, &qp); err != nil {
				return gerror.Wrapf(err, "更新配额池 %v 失败", qp.QuotaPoolName)
			}
		}
		return nil
	}); err != nil {
		return gerror.Wrap(err, "定时任务：更新配额池用户组继承关系事务失败")
	}
	return nil
}
