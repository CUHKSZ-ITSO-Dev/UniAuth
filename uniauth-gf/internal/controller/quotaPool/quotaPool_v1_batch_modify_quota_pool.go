package quotaPool

import (
	"context"
	"fmt"

	"github.com/gogf/gf/v2/database/gdb"
	"github.com/gogf/gf/v2/errors/gerror"
	"github.com/gogf/gf/v2/frame/g"

	v1 "uniauth-gf/api/quotaPool/v1"
	"uniauth-gf/internal/dao"
	"uniauth-gf/internal/model/entity"
	quotaPoolService "uniauth-gf/internal/service/quotaPool"
)

func (c *ControllerV1) BatchModifyQuotaPool(ctx context.Context, req *v1.BatchModifyQuotaPoolReq) (res *v1.BatchModifyQuotaPoolRes, err error) {
	res = &v1.BatchModifyQuotaPoolRes{}

	// 验证字段
	var column string
	switch req.Field {
	case "disabled":
		column = dao.QuotapoolQuotaPool.Columns().Disabled
	case "personal":
		column = dao.QuotapoolQuotaPool.Columns().Personal
	default:
		res.Err = fmt.Sprintf("不支持的字段: %s", req.Field)
		return
	}

	// 创建查询模型并应用过滤条件
	model := dao.QuotapoolQuotaPool.Ctx(ctx)
	model, err = quotaPoolService.ApplyQuotaPoolFilter(ctx, model, req.Filter)
	if err != nil {
		res.Err = gerror.Wrap(err, "应用过滤条件失败").Error()
		return
	}

	// 预览模式：查询受影响的记录
	var affectedPools []entity.QuotapoolQuotaPool
	err = model.Scan(&affectedPools)
	if err != nil {
		res.Err = gerror.Wrap(err, "查询受影响的记录失败").Error()
		return
	}

	res.AffectedCount = len(affectedPools)
	res.AffectedPoolNames = make([]string, len(affectedPools))
	for i, pool := range affectedPools {
		res.AffectedPoolNames[i] = pool.QuotaPoolName
	}

	// 如果是预览模式，直接返回
	if req.Preview {
		res.OK = true
		return
	}

	// 执行实际修改
	if res.AffectedCount > 0 {
		err = dao.QuotapoolQuotaPool.Transaction(ctx, func(ctx context.Context, tx gdb.TX) error {
			// 锁定要修改的记录
			if _, lockErr := dao.QuotapoolQuotaPool.Ctx(ctx).
				WhereIn(dao.QuotapoolQuotaPool.Columns().QuotaPoolName, res.AffectedPoolNames).
				LockUpdate().
				All(); lockErr != nil {
				return gerror.Wrap(lockErr, "锁定配额池记录失败")
			}

			// 重新应用过滤条件并执行更新
			updateModel := dao.QuotapoolQuotaPool.Ctx(ctx)
			updateModel, filterErr := quotaPoolService.ApplyQuotaPoolFilter(ctx, updateModel, req.Filter)
			if filterErr != nil {
				return gerror.Wrap(filterErr, "重新应用过滤条件失败")
			}

			if _, updErr := updateModel.Data(g.Map{
				column: req.Value,
			}).Update(); updErr != nil {
				return gerror.Wrap(updErr, "批量更新配额池失败")
			}
			return nil
		})
		if err != nil {
			res.Err = gerror.Wrap(err, "批量更新配额池失败").Error()
			return
		}
	}

	res.OK = true
	return
}
