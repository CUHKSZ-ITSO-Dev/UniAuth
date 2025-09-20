package quotaPool

import (
	"context"

	"github.com/gogf/gf/v2/database/gdb"
	"github.com/gogf/gf/v2/errors/gcode"
	"github.com/gogf/gf/v2/errors/gerror"

	v1 "uniauth-gf/api/quotaPool/v1"
	"uniauth-gf/internal/dao"
	"uniauth-gf/internal/model/entity"
)

func (c *ControllerV1) DeleteQuotaPool(ctx context.Context, req *v1.DeleteQuotaPoolReq) (res *v1.DeleteQuotaPoolRes, err error) {
	res = &v1.DeleteQuotaPoolRes{}

	err = dao.QuotapoolQuotaPool.Transaction(ctx, func(ctx context.Context, tx gdb.TX) error {
		var quotaPool *entity.QuotapoolQuotaPool
		err = dao.QuotapoolQuotaPool.Ctx(ctx).Where("quota_pool_name = ?", req.QuotaPoolName).LockUpdate().Scan(&quotaPool)
		if err != nil {
			return gerror.Wrap(err, "查询配额池信息失败")
		}
		if quotaPool == nil {
			return gerror.Newf("该配额池不存在，请重新检查：%v", req.QuotaPoolName)
		}

		_, delErr := dao.QuotapoolQuotaPool.Ctx(ctx).
			Where("quota_pool_name = ?", req.QuotaPoolName).
			Delete()
		if delErr != nil {
			return gerror.WrapCode(gcode.CodeDbOperationError, delErr, "删除配额池失败")
		}
		return nil
	})

	res.OK = true
	return
}
