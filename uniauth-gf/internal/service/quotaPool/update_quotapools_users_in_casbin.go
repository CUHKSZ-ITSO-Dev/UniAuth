package quotaPool

import (
	"context"
	"strings"
	"uniauth-gf/internal/dao"

	"github.com/gogf/gf/v2/errors/gerror"
	"github.com/gogf/gf/v2/frame/g"
)

// UpdateQuotaPoolsUsersInCasbin 用于根据配额池名称列表，刷新对应配额池的用户组在 Casbin 中的继承关系。
//
// 如果 qpNameList 传递 nil，则刷新所有配额池；如果传递空数组，则不进行任何操作。
//
// 如果存在失败的情况，会在处理完一轮后返回发生错误的配额池列表，不影响其他配额池的更新。
func UpdateQuotaPoolsUsersInCasbin(ctx context.Context, qpNameList *[]string) error {
	if qpNameList == nil {
		var qpNames []string
		if err := dao.QuotapoolQuotaPool.Ctx(ctx).Fields(dao.QuotapoolQuotaPool.Columns().QuotaPoolName).Scan(&qpNames); err != nil {
			return gerror.Wrap(err, "查询所有配额池失败")
		}
		qpNameList = &qpNames
	}
	if len(*qpNameList) == 0 {
		return nil // 列表为空，无需操作
	}

	failures := []string{}
	for _, qp := range *qpNameList {
		if err := Edit(ctx, g.Map{"quotaPoolName": qp}); err != nil {
			failures = append(failures, err.Error()+" 配额池："+qp)
		}
	}
	if len(failures) > 0 {
		return gerror.Newf("以下配额池更新错误：\n%v", strings.Join(failures, "\n"))
	}
	return nil
}
