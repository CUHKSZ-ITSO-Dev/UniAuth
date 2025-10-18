package tools

import (
	"context"

	"github.com/gogf/gf/v2/errors/gerror"
	"github.com/mark3labs/mcp-go/mcp"
	"github.com/mark3labs/mcp-go/server"

	v1 "uniauth-gf/api/billing/v1"
	"uniauth-gf/internal/controller/billing"
)

func RegisterGetBillRecord(s *server.MCPServer) error {
	tool := mcp.NewTool("get_bill_record",
		mcp.WithDescription("根据条件查询账单记录。"),
		mcp.WithInputSchema[v1.GetBillRecordReq](),
		mcp.WithOutputSchema[v1.GetBillRecordRes](),
	)

	s.AddTool(tool, mcp.NewStructuredToolHandler(func(ctx context.Context, request mcp.CallToolRequest, args v1.GetBillRecordReq) (v1.GetBillRecordRes, error) {
		res, err := billing.NewV1().GetBillRecord(ctx, &args)
		if err != nil {
			return v1.GetBillRecordRes{}, gerror.Wrap(err, "添加配额池失败")
		}
		return *res, nil
	}))
	return nil
}
