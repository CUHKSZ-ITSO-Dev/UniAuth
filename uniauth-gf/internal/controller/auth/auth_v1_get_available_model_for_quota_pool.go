package auth

import (
	"context"
	"strings"

	v1 "uniauth-gf/api/auth/v1"

	"github.com/gogf/gf/v2/errors/gerror"
)

func (c *ControllerV1) GetAvailableModelForQuotaPool(ctx context.Context, req *v1.GetAvailableModelForQuotaPoolReq) (res *v1.GetAvailableModelForQuotaPoolRes, err error) {
	policies, err := e.GetPermissionsForUser(req.QuotaPool)
	if err != nil {
		err = gerror.Wrap(err, "Casbin 查询配额池权限时发生内部错误")
	}
	res = &v1.GetAvailableModelForQuotaPoolRes{
		AvailableModels: []string{},
	}
	for _, policy := range policies {
		if strings.HasPrefix(policy[2], "chat/") && policy[3] == "access" && policy[4] != "deny" {
			res.AvailableModels = append(res.AvailableModels, strings.Split(policy[2], "/")[1])
		}
	}
	return
}
