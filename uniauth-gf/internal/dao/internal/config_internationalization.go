// ==========================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT.
// ==========================================================================

package internal

import (
	"context"

	"github.com/gogf/gf/v2/database/gdb"
	"github.com/gogf/gf/v2/frame/g"
)

// ConfigInternationalizationDao is the data access object for the table config_internationalization.
type ConfigInternationalizationDao struct {
	table    string                            // table is the underlying table name of the DAO.
	group    string                            // group is the database configuration group name of the current DAO.
	columns  ConfigInternationalizationColumns // columns contains all the column names of Table for convenient usage.
	handlers []gdb.ModelHandler                // handlers for customized model modification.
}

// ConfigInternationalizationColumns defines and stores column names for the table config_internationalization.
type ConfigInternationalizationColumns struct {
	Key         string //
	AppId       string //
	ZhCn        string //
	EnUs        string //
	Description string //
	CreatedAt   string //
	UpdatedAt   string //
}

// configInternationalizationColumns holds the columns for the table config_internationalization.
var configInternationalizationColumns = ConfigInternationalizationColumns{
	Key:         "key",
	AppId:       "app_id",
	ZhCn:        "zh_cn",
	EnUs:        "en_us",
	Description: "description",
	CreatedAt:   "created_at",
	UpdatedAt:   "updated_at",
}

// NewConfigInternationalizationDao creates and returns a new DAO object for table data access.
func NewConfigInternationalizationDao(handlers ...gdb.ModelHandler) *ConfigInternationalizationDao {
	return &ConfigInternationalizationDao{
		group:    "default",
		table:    "config_internationalization",
		columns:  configInternationalizationColumns,
		handlers: handlers,
	}
}

// DB retrieves and returns the underlying raw database management object of the current DAO.
func (dao *ConfigInternationalizationDao) DB() gdb.DB {
	return g.DB(dao.group)
}

// Table returns the table name of the current DAO.
func (dao *ConfigInternationalizationDao) Table() string {
	return dao.table
}

// Columns returns all column names of the current DAO.
func (dao *ConfigInternationalizationDao) Columns() ConfigInternationalizationColumns {
	return dao.columns
}

// Group returns the database configuration group name of the current DAO.
func (dao *ConfigInternationalizationDao) Group() string {
	return dao.group
}

// Ctx creates and returns a Model for the current DAO. It automatically sets the context for the current operation.
func (dao *ConfigInternationalizationDao) Ctx(ctx context.Context) *gdb.Model {
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
func (dao *ConfigInternationalizationDao) Transaction(ctx context.Context, f func(ctx context.Context, tx gdb.TX) error) (err error) {
	return dao.Ctx(ctx).Transaction(ctx, f)
}
