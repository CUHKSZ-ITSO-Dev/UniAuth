// ==========================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT. Created at 2025-09-20 21:36:19
// ==========================================================================

package internal

import (
	"context"

	"github.com/gogf/gf/v2/database/gdb"
	"github.com/gogf/gf/v2/frame/g"
)

// ConfigAutoQuotaPoolDao is the data access object for the table config_auto_quota_pool.
type ConfigAutoQuotaPoolDao struct {
	table    string                     // table is the underlying table name of the DAO.
	group    string                     // group is the database configuration group name of the current DAO.
	columns  ConfigAutoQuotaPoolColumns // columns contains all the column names of Table for convenient usage.
	handlers []gdb.ModelHandler         // handlers for customized model modification.
}

// ConfigAutoQuotaPoolColumns defines and stores column names for the table config_auto_quota_pool.
type ConfigAutoQuotaPoolColumns struct {
	Id              string // 自增主键
	RuleName        string // 规则名称，唯一
	Description     string // 规则说明
	CronCycle       string // 刷新周期
	RegularQuota    string // 定期配额
	Enabled         string // 是否启用该配额池
	FilterGroup     string // 过滤条件组
	UpnsCache       string // UPN缓存列表
	Priority        string // 优先级，数值越小优先匹配
	LastEvaluatedAt string // 该规则上次评估时间
	CreatedAt       string // 创建时间
	UpdatedAt       string // 更新时间
}

// configAutoQuotaPoolColumns holds the columns for the table config_auto_quota_pool.
var configAutoQuotaPoolColumns = ConfigAutoQuotaPoolColumns{
	Id:              "id",
	RuleName:        "rule_name",
	Description:     "description",
	CronCycle:       "cron_cycle",
	RegularQuota:    "regular_quota",
	Enabled:         "enabled",
	FilterGroup:     "filter_group",
	UpnsCache:       "upns_cache",
	Priority:        "priority",
	LastEvaluatedAt: "last_evaluated_at",
	CreatedAt:       "created_at",
	UpdatedAt:       "updated_at",
}

// NewConfigAutoQuotaPoolDao creates and returns a new DAO object for table data access.
func NewConfigAutoQuotaPoolDao(handlers ...gdb.ModelHandler) *ConfigAutoQuotaPoolDao {
	return &ConfigAutoQuotaPoolDao{
		group:    "default",
		table:    "config_auto_quota_pool",
		columns:  configAutoQuotaPoolColumns,
		handlers: handlers,
	}
}

// DB retrieves and returns the underlying raw database management object of the current DAO.
func (dao *ConfigAutoQuotaPoolDao) DB() gdb.DB {
	return g.DB(dao.group)
}

// Table returns the table name of the current DAO.
func (dao *ConfigAutoQuotaPoolDao) Table() string {
	return dao.table
}

// Columns returns all column names of the current DAO.
func (dao *ConfigAutoQuotaPoolDao) Columns() ConfigAutoQuotaPoolColumns {
	return dao.columns
}

// Group returns the database configuration group name of the current DAO.
func (dao *ConfigAutoQuotaPoolDao) Group() string {
	return dao.group
}

// Ctx creates and returns a Model for the current DAO. It automatically sets the context for the current operation.
func (dao *ConfigAutoQuotaPoolDao) Ctx(ctx context.Context) *gdb.Model {
	model := dao.DB().Model(dao.table)
	for _, handler := range dao.handlers {
		model = handler(model)
	}
	return model.Safe().Ctx(ctx)
}

// Transaction wraps the transaction logic using function f.
// It rolls back the transaction and returns the error if function f returns a non-nil error.
// It commits the transaction and returns nil if function f returns nil.
//
// Note: Do not commit or roll back the transaction in function f,
// as it is automatically handled by this function.
func (dao *ConfigAutoQuotaPoolDao) Transaction(ctx context.Context, f func(ctx context.Context, tx gdb.TX) error) (err error) {
	return dao.Ctx(ctx).Transaction(ctx, f)
}
