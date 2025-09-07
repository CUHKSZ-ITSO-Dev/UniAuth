package v1

import "github.com/gogf/gf/v2/frame/g"

type GetQuotaPoolReq struct {
	g.Meta `path:"/" tags:"QuotaPool" method:"get" summary:"获取配额池的详细配置"`
}
type GetQuotaPoolRes struct {
	//QuotaPool *entity.QuotaPool `json:"quotaPool" dc:"配额池"`
	QuotaPool string `json:"quotaPool" dc:"配额池"`
}

type NewQuotaPoolReq struct {
	g.Meta `path:"/" tags:"QuotaPool" method:"post" summary:"新建配额池"`
}
type NewQuotaPoolRes struct {
	OK bool `json:"ok" dc:"是否成功"`
}

type EditQuotaPoolReq struct {
	g.Meta `path:"/" tags:"QuotaPool" method:"put" summary:"编辑配额池"`
}
type EditQuotaPoolRes struct {
	OK bool `json:"ok" dc:"是否成功"`
}

type DeleteQuotaPoolReq struct {
	g.Meta `path:"/" tags:"QuotaPool" method:"delete" summary:"删除配额池"`
}
type DeleteQuotaPoolRes struct {
	OK bool `json:"ok" dc:"是否成功"`
}


