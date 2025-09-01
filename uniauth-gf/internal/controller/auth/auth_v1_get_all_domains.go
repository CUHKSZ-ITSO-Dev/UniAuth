package auth

import (
	"context"

	"uniauth-gf/api/auth/v1"
)

func (c *ControllerV1) GetAllDomains(ctx context.Context, req *v1.GetAllDomainsReq) (res *v1.GetAllDomainsRes, err error) {
	res = &v1.GetAllDomainsRes{}
	res.Domains, err = e.GetAllDomains()
	if err != nil {
		return nil, err
	}
	return
}
