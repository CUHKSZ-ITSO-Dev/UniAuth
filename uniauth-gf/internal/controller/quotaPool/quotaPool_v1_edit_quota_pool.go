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
		validQP := &entity.QuotapoolQuotaPool{}
		if err = dao.QuotapoolQuotaPool.Ctx(ctx).Where("quota_pool_name = ?", req.QuotaPoolName).LockUpdate().Scan(validQP); err != nil {
			return gerror.Wrap(err, "查询配额池信息失败")
		} else if validQP.QuotaPoolName == "" {
			return gerror.Newf("该配额池不存在，请重新检查：%v", req.QuotaPoolName)
		}
		qp := &entity.QuotapoolQuotaPool{
			Id:             validQP.Id,
			QuotaPoolName:  req.QuotaPoolName,
			CronCycle:      req.CronCycle,
			RegularQuota:   req.RegularQuota,
			RemainingQuota: validQP.RemainingQuota,
			LastResetAt:    validQP.LastResetAt,
			ExtraQuota:     req.ExtraQuota,
			Personal:       req.Personal,
			Disabled:       req.Disabled,
			UserinfosRules: req.UserinfosRules,
			CreatedAt:      validQP.CreatedAt,
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
