package quotaPool

import (
	"context"

	"github.com/gogf/gf/v2/database/gdb"
	"github.com/gogf/gf/v2/errors/gerror"
	"github.com/gogf/gf/v2/frame/g"

	v1 "uniauth-gf/api/quotaPool/v1"
	"uniauth-gf/internal/dao"
)

func (c *ControllerV1) BatchQuotaPoolDisabled(ctx context.Context, req *v1.BatchQuotaPoolDisabledReq) (res *v1.BatchQuotaPoolDisabledRes, err error) {
	res = &v1.BatchQuotaPoolDisabledRes{}
	var column string
	switch req.Field {
	case "disabled":
		column = "disabled"
	case "personal":
		column = "personal"
	default:
		err = gerror.Newf("不支持的字段: %s", req.Field)
		return
	}

	err = dao.QuotapoolQuotaPool.Transaction(ctx, func(ctx context.Context, tx gdb.TX) error {
		if _, lockErr := dao.QuotapoolQuotaPool.Ctx(ctx).
			WhereIn("quota_pool_name", req.QuotaPools).
			LockUpdate().
			All(); lockErr != nil {
			return gerror.Wrap(lockErr, "锁定配额池记录失败")
		}

		if _, updErr := dao.QuotapoolQuotaPool.Ctx(ctx).
			WhereIn("quota_pool_name", req.QuotaPools).
			Data(g.Map{
				column: req.Value,
			}).
			Update(); updErr != nil {
			return gerror.Wrap(updErr, "批量更新配额池失败")
		}
		return nil
	})
	if err != nil {
		err = gerror.Wrap(err, "批量更新配额池失败")
		return
	}

	res.OK = true
	return
}
