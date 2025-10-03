package quotaPool

import (
	"context"
	"strings"
	"uniauth-gf/internal/dao"
	"uniauth-gf/internal/model/entity"

	"github.com/gogf/gf/v2/errors/gerror"
	"github.com/gogf/gf/v2/frame/g"
)

// UpdateQuotaPoolsUsersInCasbin 用于根据配额池名称列表，刷新对应配额池的用户组在 Casbin 中的继承关系。
//
// 如果 qpNameList 传递 nil，则刷新所有配额池；如果传递空数组，则不进行任何操作。
//
// 如果存在失败的情况，会在处理完一轮后返回发生错误的配额池列表，不影响其他配额池的更新。
func UpdateQuotaPoolsUsersInCasbin(ctx context.Context, qpNameList *[]string) error {
	nameCol := dao.QuotapoolQuotaPool.Columns().QuotaPoolName
	db := dao.QuotapoolQuotaPool.Ctx(ctx).Fields(nameCol)
	var qps []entity.QuotapoolQuotaPool
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

	failures := []string{}
	for _, qp := range qps {
		name := qp.QuotaPoolName
		if err := Edit(ctx, g.Map{"quotaPoolName": name}); err != nil {
			failures = append(failures, gerror.Wrapf(err, "更新配额池 %v 失败", name).Error())
		}
	}
	if len(failures) > 0 {
		return gerror.Newf("以下配额池更新错误：%v", strings.Join(failures, "\n"))
	}
	return nil
}
