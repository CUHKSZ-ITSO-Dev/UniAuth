package quotaPool

import (
	"context"

	"github.com/gogf/gf/v2/errors/gcode"
	"github.com/gogf/gf/v2/errors/gerror"

	v1 "uniauth-gf/api/quotaPool/v1"
	"uniauth-gf/internal/dao"
)

func (c *ControllerV1) DeleteQuotaPool(ctx context.Context, req *v1.DeleteQuotaPoolReq) (res *v1.DeleteQuotaPoolRes, err error) {
	res = &v1.DeleteQuotaPoolRes{}
	if sqlRes, delErr := dao.QuotapoolQuotaPool.Ctx(ctx).Where("quota_pool_name = ?", req.QuotaPoolName).Delete(); delErr != nil {
		return nil, gerror.WrapCode(gcode.CodeDbOperationError, delErr, "删除配额池失败")
	} else if eftRow, err := sqlRes.RowsAffected(); eftRow == 0 {
		return nil, gerror.New("找不到配额池。数据库影响行数为0。")
	} else if err != nil {
		return nil, gerror.WrapCode(gcode.CodeDbOperationError, err, "检查配额池删除情况失败")
	}
	res.OK = true
	return
}
