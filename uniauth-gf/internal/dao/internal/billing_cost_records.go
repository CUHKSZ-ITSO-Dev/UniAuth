// ==========================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT.
// ==========================================================================

package internal

import (
	"context"

	"github.com/gogf/gf/v2/database/gdb"
	"github.com/gogf/gf/v2/frame/g"
)

// BillingCostRecordsDao is the data access object for the table billing_cost_records.
type BillingCostRecordsDao struct {
	table    string                    // table is the underlying table name of the DAO.
	group    string                    // group is the database configuration group name of the current DAO.
	columns  BillingCostRecordsColumns // columns contains all the column names of Table for convenient usage.
	handlers []gdb.ModelHandler        // handlers for customized model modification.
}

// BillingCostRecordsColumns defines and stores column names for the table billing_cost_records.
type BillingCostRecordsColumns struct {
	Id        string //
	Upn       string //
	Svc       string //
	Product   string //
	Cost      string //
	Plan      string //
	Source    string //
	Remark    string //
	CreatedAt string //
}

// billingCostRecordsColumns holds the columns for the table billing_cost_records.
var billingCostRecordsColumns = BillingCostRecordsColumns{
	Id:        "id",
	Upn:       "upn",
	Svc:       "svc",
	Product:   "product",
	Cost:      "cost",
	Plan:      "plan",
	Source:    "source",
	Remark:    "remark",
	CreatedAt: "created_at",
}

// NewBillingCostRecordsDao creates and returns a new DAO object for table data access.
func NewBillingCostRecordsDao(handlers ...gdb.ModelHandler) *BillingCostRecordsDao {
	return &BillingCostRecordsDao{
		group:    "default",
		table:    "billing_cost_records",
		columns:  billingCostRecordsColumns,
		handlers: handlers,
	}
}

// DB retrieves and returns the underlying raw database management object of the current DAO.
func (dao *BillingCostRecordsDao) DB() gdb.DB {
	return g.DB(dao.group)
}

// Table returns the table name of the current DAO.
func (dao *BillingCostRecordsDao) Table() string {
	return dao.table
}

// Columns returns all column names of the current DAO.
func (dao *BillingCostRecordsDao) Columns() BillingCostRecordsColumns {
	return dao.columns
}

// Group returns the database configuration group name of the current DAO.
func (dao *BillingCostRecordsDao) Group() string {
	return dao.group
}

// Ctx creates and returns a Model for the current DAO. It automatically sets the context for the current operation.
func (dao *BillingCostRecordsDao) Ctx(ctx context.Context) *gdb.Model {
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
func (dao *BillingCostRecordsDao) Transaction(ctx context.Context, f func(ctx context.Context, tx gdb.TX) error) (err error) {
	return dao.Ctx(ctx).Transaction(ctx, f)
}
