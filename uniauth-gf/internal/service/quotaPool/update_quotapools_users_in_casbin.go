package quotaPool

import (
	"context"
	"uniauth-gf/internal/dao"
	"uniauth-gf/internal/model/entity"

	"github.com/gogf/gf/v2/errors/gerror"
	"github.com/gogf/gf/v2/frame/g"
)

// UpdateQuotaPoolsUsersInCasbin 用于根据配额池名称列表，刷新对应配额池的用户组在 Casbin 中的继承关系。
//
// 如果 qpNameList 传递 nil，则刷新所有配额池；如果传递空数组，则不进行任何操作。
func UpdateQuotaPoolsUsersInCasbin(ctx context.Context, qpNameList *[]string) error {
	// 说明：
	// 1) 不再使用外层数据库事务，否则当循环中某次 Edit 失败时，
	//    数据库事务回滚而 Casbin 的变更无法回滚，导致不一致。
	// 2) 不对整个表使用 LockUpdate()，避免长时间锁表影响并发；
	//    依赖 Edit 内部对单个配额池的行级锁和事务来保证局部原子性。
	// 3) 一致性问题：当某个配额池更新失败时，不会回滚其他配额池的更新。
	//    但是已经更新成功的和更新失败，未更新的都能保证一致性（Edit是原子操作）

	if qpNameList == nil {
		// 全量刷新：仅查询所需字段，避免锁表
		var qps []entity.QuotapoolQuotaPool
		if err := dao.QuotapoolQuotaPool.Ctx(ctx).Fields("quota_pool_name").Scan(&qps); err != nil {
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
		return nil
	}

	// 指定列表：直接按传入名称逐个调用 Edit
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
	return nil
}
