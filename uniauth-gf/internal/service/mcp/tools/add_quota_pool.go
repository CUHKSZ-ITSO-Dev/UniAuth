package tools

import (
	"context"

	"github.com/gogf/gf/v2/encoding/gjson"
	"github.com/gogf/gf/v2/errors/gerror"
	"github.com/gogf/gf/v2/util/gconv"
	"github.com/mark3labs/mcp-go/mcp"
	"github.com/mark3labs/mcp-go/server"

	v1 "uniauth-gf/api/quotaPool/v1"
	"uniauth-gf/internal/controller/quotaPool"
)

type addQuotaPoolReq struct {
	// 配额池名称（唯一）
	QuotaPoolName string `json:"quotaPoolName" v:"required" example:"itso-deep-research-vip" jsonschema:"required" jsonschema_description:"配额池的唯一名称，例如：itso-deep-research-vip"`
	// 刷新周期（标准 Cron 表达式，支持 5 字段）
	CronCycle string `json:"cronCycle" v:"required" example:"0 3 * * *" jsonschema:"required" jsonschema_description:"刷新周期的 Cron 表达式（5字段格式），例如：0 3 * * * 表示每天凌晨3点"`
	// 定期配额（每周期重置）
	RegularQuota string `json:"regularQuota" v:"required" example:"1000" jsonschema:"required" jsonschema_description:"每周期重置的定期配额，例如：1000"`
	// 是否个人配额池
	Personal bool `json:"personal" v:"required" example:"false" jsonschema:"required" jsonschema_description:"是否为个人配额池，true 表示个人配额池，false 表示共享配额池"`
	// 是否禁用
	Disabled bool `json:"disabled" d:"false" example:"false" jsonschema_description:"是否禁用配额池，true 表示禁用，false 表示启用，默认为 false"`
	// 初始加油包
	ExtraQuota string `json:"extraQuota" d:"0" example:"0" jsonschema_description:"初始加油包配额，默认为 0"`
	// ITTools 规则（可选）
	UserinfosRules *gjson.Json `json:"userinfosRules" jsonschema_description:"ITTools 用户信息过滤规则（可选），用于动态匹配用户"`
}

func RegisterAddQuotaPool(s *server.MCPServer) error {
	tool := mcp.NewTool("add_quota_pool",
		mcp.WithDescription("新增配额池。"),
		mcp.WithInputSchema[addQuotaPoolReq](),
		mcp.WithOutputSchema[v1.NewQuotaPoolRes](),
	)

	s.AddTool(tool, mcp.NewStructuredToolHandler(func(ctx context.Context, request mcp.CallToolRequest, args addQuotaPoolReq) (v1.NewQuotaPoolRes, error) {
		var req v1.NewQuotaPoolReq
		if gconv.Struct(args, &req) != nil {
			return v1.NewQuotaPoolRes{}, gerror.New("转换请求参数失败")
		}
		res, err := quotaPool.NewV1().NewQuotaPool(ctx, &req)
		if err != nil {
			return v1.NewQuotaPoolRes{}, gerror.Wrap(err, "添加配额池失败")
		}
		return *res, nil
	}))
	return nil
}
