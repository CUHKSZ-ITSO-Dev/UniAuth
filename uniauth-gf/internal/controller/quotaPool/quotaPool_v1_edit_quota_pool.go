package quotaPool

import (
	"context"

	"github.com/gogf/gf/v2/database/gdb"
	"github.com/gogf/gf/v2/errors/gerror"

	v1 "uniauth-gf/api/quotaPool/v1"
	"uniauth-gf/internal/dao"
	"uniauth-gf/internal/model/entity"
	"uniauth-gf/internal/service/quotaPool"
)

func (c *ControllerV1) EditQuotaPool(ctx context.Context, req *v1.EditQuotaPoolReq) (res *v1.EditQuotaPoolRes, err error) {
	res = &v1.EditQuotaPoolRes{}
	err = dao.QuotapoolQuotaPool.Transaction(ctx, func(ctx context.Context, tx gdb.TX) error {		
		var qp *entity.QuotapoolQuotaPool
		err = dao.QuotapoolQuotaPool.Ctx(ctx).Where("quota_pool_name = ?", req.QuotaPoolName).LockUpdate().Scan(&qp)
		if err != nil {
			return gerror.Wrap(err, "查询配额池信息失败")
		}
		if qp == nil {
			return gerror.Newf("该配额池不存在，请重新检查：%v", req.QuotaPoolName)
		}
		if err = quotaPool.Edit(ctx, qp); err != nil {
			return gerror.Wrap(err, "更新配额池失败")
		}
		return nil
	})
	if err != nil {
		err = gerror.Wrapf(err, "更新配额池 %v 事务失败", req.QuotaPoolName)
		return
	}
	res.OK = true
	return
}
