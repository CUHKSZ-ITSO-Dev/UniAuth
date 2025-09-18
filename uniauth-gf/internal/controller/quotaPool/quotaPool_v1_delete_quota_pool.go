package quotaPool

import (
	"context"

	"github.com/gogf/gf/v2/database/gdb"
	"github.com/gogf/gf/v2/errors/gcode"
	"github.com/gogf/gf/v2/errors/gerror"
	"github.com/gogf/gf/v2/frame/g"

	v1 "uniauth-gf/api/quotaPool/v1"
	"uniauth-gf/internal/dao"
)

func (c *ControllerV1) DeleteQuotaPool(ctx context.Context, req *v1.DeleteQuotaPoolReq) (res *v1.DeleteQuotaPoolRes, err error) {
	res = &v1.DeleteQuotaPoolRes{}

	// 从查询参数中获取要删除的配额池名称
	r := g.RequestFromCtx(ctx)
	quotaPoolName := r.GetQuery("quotaPoolName").String()
	if quotaPoolName == "" {
		err = gerror.NewCodef(gcode.CodeMissingParameter, "quotaPoolName 必填")
		return
	}

	err = dao.QuotapoolQuotaPool.Transaction(ctx, func(ctx context.Context, tx gdb.TX) error {
		count, err := dao.QuotapoolQuotaPool.Ctx(ctx).
			Where("quota_pool_name = ?", quotaPoolName).
			LockUpdate().
			Count()
		if err != nil {
			return gerror.WrapCode(gcode.CodeDbOperationError, err, "检查配额池是否存在失败")
		}
		if count == 0 {
			return gerror.NewCodef(gcode.CodeNotFound, "配额池不存在: %s", quotaPoolName)
		}

		_, delErr := dao.QuotapoolQuotaPool.Ctx(ctx).
			Where("quota_pool_name = ?", quotaPoolName).
			Delete()
		if delErr != nil {
			return gerror.WrapCode(gcode.CodeDbOperationError, delErr, "删除配额池失败")
		}
		return nil
	})
	if err != nil {
		return
	}

	res.OK = true
	return
}
