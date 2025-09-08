package auth

import (
	"context"
	"strings"

	v1 "uniauth-gf/api/auth/v1"
)

func (c *ControllerV1) GetAvailableModelForQuotaPool(ctx context.Context, req *v1.GetAvailableModelForQuotaPoolReq) (res *v1.GetAvailableModelForQuotaPoolRes, err error) {
	policies := e.GetPermissionsForUserInDomain(req.QuotaPool, req.Dom)
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
