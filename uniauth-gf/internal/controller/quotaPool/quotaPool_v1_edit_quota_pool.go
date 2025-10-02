package quotaPool

import (
	"context"

	"github.com/gogf/gf/v2/errors/gerror"
	"github.com/gogf/gf/v2/frame/g"

	v1 "uniauth-gf/api/quotaPool/v1"
	"uniauth-gf/internal/service/quotaPool"
)

func (c *ControllerV1) EditQuotaPool(ctx context.Context, req *v1.EditQuotaPoolReq) (res *v1.EditQuotaPoolRes, err error) {
	res = &v1.EditQuotaPoolRes{}

	// 手动构建 map，只包含非 nil 的字段
	qp := g.Map{
		"quotaPoolName": req.QuotaPoolName,
	}
	// 处理可选的指针字段
	if req.CronCycle != nil {
		qp["cronCycle"] = *req.CronCycle
	}
	if req.RegularQuota != nil {
		qp["regularQuota"] = *req.RegularQuota
	}
	if req.Personal != nil {
		qp["personal"] = *req.Personal
	}
	if req.Disabled != nil {
		qp["disabled"] = *req.Disabled
	}
	if req.ExtraQuota != nil {
		qp["extraQuota"] = *req.ExtraQuota
	}
	if req.UserinfosRules != nil {
		qp["userinfosRules"] = req.UserinfosRules
	}

	if err = quotaPool.Edit(ctx, qp); err != nil {
		return nil, gerror.Wrap(err, "更新配额池失败")
	}

	res.OK = true
	return
}
