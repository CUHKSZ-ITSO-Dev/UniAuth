package v1

import "github.com/gogf/gf/v2/frame/g"

	"github.com/gogf/gf/v2/encoding/gjson"
	"github.com/gogf/gf/v2/frame/g"
	"github.com/shopspring/decimal"
)

type GetQuotaPoolReq struct {
	g.Meta        `path:"/" tags:"QuotaPool" method:"get" summary:"获取配额池的详细配置"`
	QuotaPoolName string `json:"quotaPoolName" dc:"指定配额池名称（可选）"`
	Page          int    `json:"page" v:"min:1" dc:"页码，从1开始" default:"1"`
	PageSize      int    `json:"pageSize" v:"min:1|max:1000" dc:"每页条数，最大1000" default:"20"`
	All           bool   `json:"all" dc:"是否返回全部数据，true时忽略分页参数，但仍有最大限制保护" default:"false"`
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
