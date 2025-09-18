// ==========================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT. Created at 2025-09-16 12:07:45
// ==========================================================================

package internal

import (
	"context"

	"github.com/gogf/gf/v2/database/gdb"
	"github.com/gogf/gf/v2/frame/g"
)

// ConfigSingleModelApproachDao is the data access object for the table config_single_model_approach.
type ConfigSingleModelApproachDao struct {
	table    string                           // table is the underlying table name of the DAO.
	group    string                           // group is the database configuration group name of the current DAO.
	columns  ConfigSingleModelApproachColumns // columns contains all the column names of Table for convenient usage.
	handlers []gdb.ModelHandler               // handlers for customized model modification.
}

// ConfigSingleModelApproachColumns defines and stores column names for the table config_single_model_approach.
type ConfigSingleModelApproachColumns struct {
	ApproachName string //
	Pricing      string //
	Discount     string //
	ClientType   string //
	ClientArgs   string //
	RequestArgs  string //
	Servicewares string //
	UpdatedAt    string //
	CreatedAt    string //
}

// configSingleModelApproachColumns holds the columns for the table config_single_model_approach.
var configSingleModelApproachColumns = ConfigSingleModelApproachColumns{
	ApproachName: "approach_name",
	Pricing:      "pricing",
	Discount:     "discount",
	ClientType:   "client_type",
	ClientArgs:   "client_args",
	RequestArgs:  "request_args",
	Servicewares: "servicewares",
	UpdatedAt:    "updated_at",
	CreatedAt:    "created_at",
}

// NewConfigSingleModelApproachDao creates and returns a new DAO object for table data access.
func NewConfigSingleModelApproachDao(handlers ...gdb.ModelHandler) *ConfigSingleModelApproachDao {
	return &ConfigSingleModelApproachDao{
		group:    "default",
		table:    "config_single_model_approach",
		columns:  configSingleModelApproachColumns,
		handlers: handlers,
	}
}

// DB retrieves and returns the underlying raw database management object of the current DAO.
func (dao *ConfigSingleModelApproachDao) DB() gdb.DB {
	return g.DB(dao.group)
}

// Table returns the table name of the current DAO.
func (dao *ConfigSingleModelApproachDao) Table() string {
	return dao.table
}

// Columns returns all column names of the current DAO.
func (dao *ConfigSingleModelApproachDao) Columns() ConfigSingleModelApproachColumns {
	return dao.columns
}

// Group returns the database configuration group name of the current DAO.
func (dao *ConfigSingleModelApproachDao) Group() string {
	return dao.group
}

// Ctx creates and returns a Model for the current DAO. It automatically sets the context for the current operation.
func (dao *ConfigSingleModelApproachDao) Ctx(ctx context.Context) *gdb.Model {
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
func (dao *ConfigSingleModelApproachDao) Transaction(ctx context.Context, f func(ctx context.Context, tx gdb.TX) error) (err error) {
	return dao.Ctx(ctx).Transaction(ctx, f)
}
