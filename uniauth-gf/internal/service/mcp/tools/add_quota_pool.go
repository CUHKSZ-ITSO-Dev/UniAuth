package tools

import (
	"context"

	"github.com/gogf/gf/v2/errors/gerror"
	"github.com/mark3labs/mcp-go/mcp"
	"github.com/mark3labs/mcp-go/server"

	v1 "uniauth-gf/api/quotaPool/v1"
	"uniauth-gf/internal/controller/quotaPool"
)

func RegisterAddQuotaPool(s *server.MCPServer) error {
	tool := mcp.NewTool("add_quota_pool",
		mcp.WithDescription("新增配额池。"),
		mcp.WithInputSchema[v1.NewQuotaPoolReq](),
		mcp.WithOutputSchema[v1.NewQuotaPoolRes](),
	)

	s.AddTool(tool, mcp.NewStructuredToolHandler(func(ctx context.Context, request mcp.CallToolRequest, args v1.NewQuotaPoolReq) (v1.NewQuotaPoolRes, error) {
		res, err := quotaPool.NewV1().NewQuotaPool(ctx, &args)
		if err != nil {
			return v1.NewQuotaPoolRes{}, gerror.Wrap(err, "添加配额池失败")
		}
		return *res, nil
	}))
	return nil
}
