// ==========================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT. Created at 2025-09-17 16:51:00
// ==========================================================================

package internal

import (
	"context"

	"github.com/gogf/gf/v2/database/gdb"
	"github.com/gogf/gf/v2/frame/g"
)

// ConfigExchangeRateDao is the data access object for the table config_exchange_rate.
type ConfigExchangeRateDao struct {
	table    string                    // table is the underlying table name of the DAO.
	group    string                    // group is the database configuration group name of the current DAO.
	columns  ConfigExchangeRateColumns // columns contains all the column names of Table for convenient usage.
	handlers []gdb.ModelHandler        // handlers for customized model modification.
}

// ConfigExchangeRateColumns defines and stores column names for the table config_exchange_rate.
type ConfigExchangeRateColumns struct {
	Date      string // 汇率日期
	F         string // 本位货币
	T         string // 标的货币
	Rate      string // 1 本位货币 = rate 标的货币
	CreatedAt string //
}

// configExchangeRateColumns holds the columns for the table config_exchange_rate.
var configExchangeRateColumns = ConfigExchangeRateColumns{
	Date:      "date",
	F:         "f",
	T:         "t",
	Rate:      "rate",
	CreatedAt: "created_at",
}

// NewConfigExchangeRateDao creates and returns a new DAO object for table data access.
func NewConfigExchangeRateDao(handlers ...gdb.ModelHandler) *ConfigExchangeRateDao {
	return &ConfigExchangeRateDao{
		group:    "default",
		table:    "config_exchange_rate",
		columns:  configExchangeRateColumns,
		handlers: handlers,
	}
}

// DB retrieves and returns the underlying raw database management object of the current DAO.
func (dao *ConfigExchangeRateDao) DB() gdb.DB {
	return g.DB(dao.group)
}

// Table returns the table name of the current DAO.
func (dao *ConfigExchangeRateDao) Table() string {
	return dao.table
}

// Columns returns all column names of the current DAO.
func (dao *ConfigExchangeRateDao) Columns() ConfigExchangeRateColumns {
	return dao.columns
}

// Group returns the database configuration group name of the current DAO.
func (dao *ConfigExchangeRateDao) Group() string {
	return dao.group
}

// Ctx creates and returns a Model for the current DAO. It automatically sets the context for the current operation.
func (dao *ConfigExchangeRateDao) Ctx(ctx context.Context) *gdb.Model {
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
func (dao *ConfigExchangeRateDao) Transaction(ctx context.Context, f func(ctx context.Context, tx gdb.TX) error) (err error) {
	return dao.Ctx(ctx).Transaction(ctx, f)
}
