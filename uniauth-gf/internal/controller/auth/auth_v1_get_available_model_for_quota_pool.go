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
		if strings.HasPrefix(policy[1], "chat/approach/") && policy[2] == "access" && policy[3] != "deny" {
			res.AvailableModels = append(res.AvailableModels, strings.Split(policy[1], "/")[2])
		}
	}

	// 如果 res.AvailableModels 里有 "qwen3-235b-a22b-instruct-2507"，则将其移动到第一个位置
	for i, model := range res.AvailableModels {
		if model == "qwen3-235b-a22b-instruct-2507" {
			if i != 0 {
				// 移动到第一个位置
				res.AvailableModels = append([]string{model}, append(res.AvailableModels[:i], res.AvailableModels[i+1:]...)...)
			}
			break
		}
	}
	return
}
