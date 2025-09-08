// ==========================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT.
// ==========================================================================

package internal

import (
	"context"

	"github.com/gogf/gf/v2/database/gdb"
	"github.com/gogf/gf/v2/frame/g"
)

// QuotapoolQuotaPoolDao is the data access object for the table quotapool_quota_pool.
type QuotapoolQuotaPoolDao struct {
	table    string                    // table is the underlying table name of the DAO.
	group    string                    // group is the database configuration group name of the current DAO.
	columns  QuotapoolQuotaPoolColumns // columns contains all the column names of Table for convenient usage.
	handlers []gdb.ModelHandler        // handlers for customized model modification.
}

// QuotapoolQuotaPoolColumns defines and stores column names for the table quotapool_quota_pool.
type QuotapoolQuotaPoolColumns struct {
	Id             string // 自增主键
	QuotaPoolName  string // 配额池名称
	CronCycle      string // 刷新周期
	RegularQuota   string // 定期配额
	RemainingQuota string // 剩余配额
	LastResetAt    string // 上次刷新时间
	ExtraQuota     string // 加油包
	Personal       string // 是否个人配额池
	Disabled       string // 是否禁用
	UserinfosRules string // ITTools规则
	CreatedAt      string // 创建时间
}

// quotapoolQuotaPoolColumns holds the columns for the table quotapool_quota_pool.
var quotapoolQuotaPoolColumns = QuotapoolQuotaPoolColumns{
	Id:             "id",
	QuotaPoolName:  "quota_pool_name",
	CronCycle:      "cron_cycle",
	RegularQuota:   "regular_quota",
	RemainingQuota: "remaining_quota",
	LastResetAt:    "last_reset_at",
	ExtraQuota:     "extra_quota",
	Personal:       "personal",
	Disabled:       "disabled",
	UserinfosRules: "userinfos_rules",
	CreatedAt:      "created_at",
}

// NewQuotapoolQuotaPoolDao creates and returns a new DAO object for table data access.
func NewQuotapoolQuotaPoolDao(handlers ...gdb.ModelHandler) *QuotapoolQuotaPoolDao {
	return &QuotapoolQuotaPoolDao{
		group:    "default",
		table:    "quotapool_quota_pool",
		columns:  quotapoolQuotaPoolColumns,
		handlers: handlers,
	}
}

// DB retrieves and returns the underlying raw database management object of the current DAO.
func (dao *QuotapoolQuotaPoolDao) DB() gdb.DB {
	return g.DB(dao.group)
}

// Table returns the table name of the current DAO.
func (dao *QuotapoolQuotaPoolDao) Table() string {
	return dao.table
}

// Columns returns all column names of the current DAO.
func (dao *QuotapoolQuotaPoolDao) Columns() QuotapoolQuotaPoolColumns {
	return dao.columns
}

// Group returns the database configuration group name of the current DAO.
func (dao *QuotapoolQuotaPoolDao) Group() string {
	return dao.group
}

// Ctx creates and returns a Model for the current DAO. It automatically sets the context for the current operation.
func (dao *QuotapoolQuotaPoolDao) Ctx(ctx context.Context) *gdb.Model {
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
func (dao *QuotapoolQuotaPoolDao) Transaction(ctx context.Context, f func(ctx context.Context, tx gdb.TX) error) (err error) {
	return dao.Ctx(ctx).Transaction(ctx, f)
}
