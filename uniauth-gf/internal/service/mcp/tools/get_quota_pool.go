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

// QuotaPoolDTO 是用于 MCP 工具输出的配额池数据传输对象（DTO）
// 此结构体专门用于 get_quota_pool 工具的 JSON 输出，移除了不必要的 orm 标签
// 仅保留 json 和 description 标签用于 MCP 工具输出
type QuotaPoolDTO struct {
	QuotaPoolName  string      `json:"quotaPoolName"  description:"配额池名称"`     // 配额池名称
	CronCycle      string      `json:"cronCycle"      description:"刷新周期"`      // 刷新周期
	RegularQuota   string      `json:"regularQuota"   description:"定期配额"`      // 定期配额
	RemainingQuota string      `json:"remainingQuota" description:"剩余配额"`      // 剩余配额
	LastResetAt    string      `json:"lastResetAt"    description:"上次刷新时间"`    // 上次刷新时间
	ExtraQuota     string      `json:"extraQuota"     description:"加油包"`       // 加油包
	Personal       bool        `json:"personal"       description:"是否个人配额池"`   // 是否个人配额池
	Disabled       bool        `json:"disabled"       description:"是否禁用"`      // 是否禁用
	UserinfosRules *gjson.Json `json:"userinfosRules" description:"ITTools规则"` // ITTools规则
	CreatedAt      string      `json:"createdAt"      description:"创建时间"`      // 创建时间
	UpdatedAt      string      `json:"updatedAt"      description:"修改时间"`      // 修改时间
}

func RegisterGetQuotaPool(s *server.MCPServer) error {
	tool := mcp.NewTool("get_quota_pool",
		mcp.WithDescription("给定配额池名称，获取配额池详细配置。"),
		mcp.WithInputSchema[v1.GetQuotaPoolReq](),
		mcp.WithOutputSchema[QuotaPoolDTO](),
	)

	s.AddTool(tool, mcp.NewStructuredToolHandler(func(ctx context.Context, request mcp.CallToolRequest, args v1.GetQuotaPoolReq) (QuotaPoolDTO, error) {
		res, err := quotaPool.NewV1().GetQuotaPool(ctx, &args)
		if err != nil {
			return QuotaPoolDTO{}, gerror.Wrap(err, "获取配额池失败")
		}
		var qpInfo QuotaPoolDTO
		if convertErr := gconv.Struct(res, &qpInfo); convertErr != nil {
			return QuotaPoolDTO{}, gerror.Wrap(convertErr, "转换配额池信息失败")
		}
		return qpInfo, nil
	}))
	return nil
}
