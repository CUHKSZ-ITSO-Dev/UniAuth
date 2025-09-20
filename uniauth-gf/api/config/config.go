// =================================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT.
// =================================================================================

package config

import (
	"context"

	"uniauth-gf/api/config/v1"
)

type IConfigV1 interface {
	GetAutoQuotaPoolConfig(ctx context.Context, req *v1.GetAutoQuotaPoolConfigReq) (res *v1.GetAutoQuotaPoolConfigRes, err error)
	EditAutoQuotaPoolConfig(ctx context.Context, req *v1.EditAutoQuotaPoolConfigReq) (res *v1.EditAutoQuotaPoolConfigRes, err error)
	DeleteAutoQuotaPoolConfig(ctx context.Context, req *v1.DeleteAutoQuotaPoolConfigReq) (res *v1.DeleteAutoQuotaPoolConfigRes, err error)
	AddAutoQuotaPoolConfig(ctx context.Context, req *v1.AddAutoQuotaPoolConfigReq) (res *v1.AddAutoQuotaPoolConfigRes, err error)
	GetModelConfig(ctx context.Context, req *v1.GetModelConfigReq) (res *v1.GetModelConfigRes, err error)
	AddModelConfig(ctx context.Context, req *v1.AddModelConfigReq) (res *v1.AddModelConfigRes, err error)
	EditModelConfig(ctx context.Context, req *v1.EditModelConfigReq) (res *v1.EditModelConfigRes, err error)
	DeleteModelConfig(ctx context.Context, req *v1.DeleteModelConfigReq) (res *v1.DeleteModelConfigRes, err error)
	GetI18nConfig(ctx context.Context, req *v1.GetI18nConfigReq) (res *v1.GetI18nConfigRes, err error)
	AddI18nItem(ctx context.Context, req *v1.AddI18nItemReq) (res *v1.AddI18nItemRes, err error)
	EditI18nItem(ctx context.Context, req *v1.EditI18nItemReq) (res *v1.EditI18nItemRes, err error)
	DeleteI18Config(ctx context.Context, req *v1.DeleteI18ConfigReq) (res *v1.DeleteI18ConfigRes, err error)
	GetAllLangs(ctx context.Context, req *v1.GetAllLangsReq) (res *v1.GetAllLangsRes, err error)
}
