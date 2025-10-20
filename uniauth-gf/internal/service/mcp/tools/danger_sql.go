package tools

import (
	"context"

	"github.com/gogf/gf/v2/frame/g"
	"github.com/mark3labs/mcp-go/mcp"
	"github.com/mark3labs/mcp-go/server"
)

func RegisterDangerSql(s *server.MCPServer) error {
	tool := mcp.NewTool("get_arbitrary_billing_records_with_sql",
		mcp.WithDescription("查询任意账单记录，支持SQL语句。数据库为 Postgres SQL 17。"),
		mcp.WithString("sql",
			mcp.Required(),
			mcp.Description("The arithmetic SQL to perform。 Here is the table structure:"+
				`
CREATE TABLE billing_cost_records (
    id BIGSERIAL PRIMARY KEY,
    upn VARCHAR(255) NOT NULL,
    svc VARCHAR(255) NOT NULL,
    product VARCHAR(255) NOT NULL,
    cost NUMERIC(25, 10) NOT NULL,
    original_cost NUMERIC(25, 10) NOT NULL,
    plan VARCHAR(255) NOT NULL,
    source VARCHAR(255) NOT NULL,
    remark JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_billing_cost_records_upn ON billing_cost_records(upn);
CREATE INDEX idx_billing_cost_records_svc ON billing_cost_records(svc);
CREATE INDEX idx_billing_cost_records_svc_and_product ON billing_cost_records(svc, product);
CREATE INDEX idx_billing_cost_records_source ON billing_cost_records(source);
CREATE INDEX idx_billing_cost_records_created_at ON billing_cost_records(created_at);

COMMENT ON COLUMN billing_cost_records.id IS '自增主键';
COMMENT ON COLUMN billing_cost_records.upn IS 'UPN';
COMMENT ON COLUMN billing_cost_records.svc IS '服务名称';
COMMENT ON COLUMN billing_cost_records.product IS '产品名称';
COMMENT ON COLUMN billing_cost_records.cost IS '费用';
COMMENT ON COLUMN billing_cost_records.original_cost IS '原始费用';
COMMENT ON COLUMN billing_cost_records.plan IS '计费方案';
COMMENT ON COLUMN billing_cost_records.source IS '来源';
COMMENT ON COLUMN billing_cost_records.remark IS '备注信息';
COMMENT ON COLUMN billing_cost_records.created_at IS '创建时间';
`),
		),
	)

	s.AddTool(tool, func(ctx context.Context, request mcp.CallToolRequest) (*mcp.CallToolResult, error) {
		sql := request.GetString("sql", "")
		records, err := g.DB("readonly").GetAll(ctx, sql)
		if err != nil {
			return mcp.NewToolResultError(err.Error()), nil
		}
		return mcp.NewToolResultText(records.Json()), nil
	})
	return nil
}
