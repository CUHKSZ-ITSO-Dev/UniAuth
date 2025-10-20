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
		mcp.WithDescription("根据条件查询账单记录。有两个类型的账单，需要指定 type：<br>1. type = qp，返回每个配额池名下特定upns相关的账单；<br>2. type = upn，返回每个upn名下这些特定qps相关的账单。<br>数组传空时，则忽略对应的限制。"),
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
