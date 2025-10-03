package quotaPool

import (
	"context"
	"uniauth-gf/internal/dao"
	"uniauth-gf/internal/model/entity"

	"github.com/gogf/gf/v2/database/gdb"
	"github.com/gogf/gf/v2/errors/gerror"
	"github.com/gogf/gf/v2/frame/g"
)

// UpdateQuotaPoolsUsersInCasbin 用于根据配额池名称列表，刷新对应配额池的用户组在 Casbin 中的继承关系。
//
// 如果 qpNameList 传递 nil，则刷新所有配额池；如果传递空数组，则不进行任何操作。
func UpdateQuotaPoolsUsersInCasbin(ctx context.Context, qpNameList *[]string) error {
	if err := dao.QuotapoolQuotaPool.Transaction(ctx, func(ctx context.Context, tx gdb.TX) error {
		db := dao.QuotapoolQuotaPool.Ctx(ctx).LockUpdate()
		if qpNameList == nil {
			// 全量刷新：扫描所有配额池名称并逐个调用 Edit
			var qps []entity.QuotapoolQuotaPool
			if err := db.Scan(&qps); err != nil {
				return gerror.Wrap(err, "查询所有配额池失败")
			}
			for _, qp := range qps {
				name := qp.QuotaPoolName
				if name == "" {
					return gerror.New("配额池名称缺失")
				}
				if err := Edit(ctx, g.Map{"quotaPoolName": name}); err != nil {
					return gerror.Wrapf(err, "更新配额池 %v 失败", name)
				}
			}
		} else {
			// 指定列表：直接按传入名称逐个调用 Edit，避免再做一轮查询取名
			if len(*qpNameList) == 0 {
				return nil // 列表为空，无需操作
			}
			for _, name := range *qpNameList {
				if name == "" {
					return gerror.New("配额池名称缺失")
				}
				if err := Edit(ctx, g.Map{"quotaPoolName": name}); err != nil {
					return gerror.Wrapf(err, "更新配额池 %v 失败", name)
				}
			}
		}
		return nil
	}); err != nil {
		return gerror.Wrap(err, "更新配额池用户组继承关系事务失败")
	}
	return nil
}
