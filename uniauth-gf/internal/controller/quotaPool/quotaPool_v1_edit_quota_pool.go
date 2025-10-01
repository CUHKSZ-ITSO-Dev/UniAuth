package quotaPool

import (
	"context"

	"github.com/gogf/gf/v2/database/gdb"
	"github.com/gogf/gf/v2/errors/gerror"
	"github.com/gogf/gf/v2/frame/g"
	"github.com/gogf/gf/v2/util/gconv"

	v1 "uniauth-gf/api/quotaPool/v1"
	"uniauth-gf/internal/dao"
	"uniauth-gf/internal/service/quotaPool"
)

func (c *ControllerV1) EditQuotaPool(ctx context.Context, req *v1.EditQuotaPoolReq) (res *v1.EditQuotaPoolRes, err error) {
	res = &v1.EditQuotaPoolRes{}
	err = dao.QuotapoolQuotaPool.Transaction(ctx, func(ctx context.Context, tx gdb.TX) error {
		var qp g.Map
		if err = gconv.Struct(req, &qp); err != nil {
			return gerror.Wrap(err, "请求参数转换失败")
		}

		// 剔除 nil 值和 Meta 字段
		for k, v := range qp {
			if v == nil {
				delete(qp, k)
			}
		}
		delete(qp, "Meta")

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
