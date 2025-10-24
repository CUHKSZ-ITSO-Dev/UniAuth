package tools

import (
	"context"

	v1 "uniauth-gf/api/quotaPool/v1"
	"uniauth-gf/internal/controller/quotaPool"

	"github.com/gogf/gf/v2/encoding/gjson"
	"github.com/gogf/gf/v2/errors/gerror"
	"github.com/gogf/gf/v2/util/gconv"
	"github.com/mark3labs/mcp-go/mcp"
	"github.com/mark3labs/mcp-go/server"
)

type quotapoolQuotaPool struct {
	QuotaPoolName  string      `json:"quotaPoolName"  orm:"quota_pool_name" description:"配额池名称"`     // 配额池名称
	CronCycle      string      `json:"cronCycle"      orm:"cron_cycle"      description:"刷新周期"`      // 刷新周期
	RegularQuota   string      `json:"regularQuota"   orm:"regular_quota"   description:"定期配额"`      // 定期配额
	RemainingQuota string      `json:"remainingQuota" orm:"remaining_quota" description:"剩余配额"`      // 剩余配额
	LastResetAt    string      `json:"lastResetAt"    orm:"last_reset_at"   description:"上次刷新时间"`    // 上次刷新时间
	ExtraQuota     string      `json:"extraQuota"     orm:"extra_quota"     description:"加油包"`       // 加油包
	Personal       bool        `json:"personal"       orm:"personal"        description:"是否个人配额池"`   // 是否个人配额池
	Disabled       bool        `json:"disabled"       orm:"disabled"        description:"是否禁用"`      // 是否禁用
	UserinfosRules *gjson.Json `json:"userinfosRules" orm:"userinfos_rules" description:"ITTools规则"` // ITTools规则
	CreatedAt      string      `json:"createdAt"      orm:"created_at"      description:"创建时间"`      // 创建时间
	UpdatedAt      string      `json:"updatedAt"      orm:"updated_at"      description:"修改时间"`      // 修改时间
}

func RegisterGetQuotaPool(s *server.MCPServer) error {
	tool := mcp.NewTool("get_quota_pool",
		mcp.WithDescription("给定配额池名称，获取配额池详细配置。"),
		mcp.WithInputSchema[v1.GetQuotaPoolReq](),
		mcp.WithOutputSchema[quotapoolQuotaPool](),
	)

	s.AddTool(tool, mcp.NewStructuredToolHandler(func(ctx context.Context, request mcp.CallToolRequest, args v1.GetQuotaPoolReq) (quotapoolQuotaPool, error) {
		res, err := quotaPool.NewV1().GetQuotaPool(ctx, &args)
		if err != nil {
			return quotapoolQuotaPool{}, gerror.Wrap(err, "获取配额池失败")
		}
		var qpInfo quotapoolQuotaPool
        if convertErr := gconv.Struct(res, &qpInfo); convertErr != nil {
            return quotapoolQuotaPool{}, gerror.Wrap(convertErr, "转换配额池信息失败")
        }
		return qpInfo, nil
	}))
	return nil
}
