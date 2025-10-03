package auth

import (
	"context"

	v1 "uniauth-gf/api/auth/v1"
	"uniauth-gf/internal/dao"

	"github.com/gogf/gf/v2/errors/gerror"
)

/*
对话服务开启计费流程前的一站式权限检查。会进行以下检查：

1. 检查配额池是否存在；

2. 检查配额池是否被禁用；

3. 检查用户有没有权限使用这个配额池；

4. 检查配额池有没有权限使用这个 Svc 和 Product。
*/
func (c *ControllerV1) ChatPreCheckOneStop(ctx context.Context, req *v1.ChatPreCheckOneStopReq) (res *v1.ChatPreCheckOneStopRes, err error) {
	res = &v1.ChatPreCheckOneStopRes{
		Ok: false,
	}

	// Step 1
	record, err := dao.QuotapoolQuotaPool.Ctx(ctx).Where("quota_pool_name = ?", req.QuotaPool).One()
	if err != nil {
		err = gerror.Wrap(err, "数据库查找配额池发生内部错误")
		return
	}
	if record.IsEmpty() {
		err = gerror.New("找不到配额池")
		return
	}

	// Step 2
	if record["Disabled"].Bool() {
		err = gerror.New("该配额池处于禁用状态")
		return
	}

	// Step 3
	has, err := e.HasGroupingPolicy(req.Upn, req.QuotaPool)
	if err != nil {
		err = gerror.Wrap(err, "Casbin在检查是否有角色继承关系时发生内部错误")
		return
	}
	if !has {
		err = gerror.New("该用户没有权限使用这个配额池")
		return
	}

	// Step 4
	allow, err := e.Enforce(req.Upn, req.Svc+"/approach/"+req.Product, req.Act)
	if err != nil {
		err = gerror.Wrap(err, "Casbin在检查配额池策略时发生内部错误")
		return
	}
	if !allow {
		err = gerror.New("该配额池没有使用 Svc/Product 的权限")
		return
	}

	res.Ok = true
	return
}
