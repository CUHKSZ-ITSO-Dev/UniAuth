package tools

import "uniauth-gf/internal/service/mcp/registry"

func init() {
	// 注册系统分类的所有工具
	registry.RegisterTool("hello_world", RegisterHelloWorld)
	registry.RegisterTool("calculator", RegisterCalculator)
	registry.RegisterTool("get_user_info", RegisterGetUserInfo)
	registry.RegisterTool("add_quota_pool", RegisterAddQuotaPool)
	registry.RegisterTool("get_quota_pool", RegisterGetQuotaPool)
	// registry.RegisterTool("get_bill_record", RegisterGetBillRecord)
	registry.RegisterTool("get_arbitrary_billing_records_with_sql", RegisterDangerSql)
}
