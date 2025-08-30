// ==========================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT.
// ==========================================================================

package internal

import (
	"context"

	"github.com/gogf/gf/v2/database/gdb"
	"github.com/gogf/gf/v2/frame/g"
)

// UserInfosDao is the data access object for the table user_infos.
type UserInfosDao struct {
	table    string             // table is the underlying table name of the DAO.
	group    string             // group is the database configuration group name of the current DAO.
	columns  UserInfosColumns   // columns contains all the column names of Table for convenient usage.
	handlers []gdb.ModelHandler // handlers for customized model modification.
}

// UserInfosColumns defines and stores column names for the table user_infos.
type UserInfosColumns struct {
	Upn                        string //
	DisplayName                string //
	UniqueName                 string //
	SamAccountName             string //
	Email                      string //
	SchoolStatus               string //
	IdentityType               string //
	EmployeeId                 string //
	Name                       string //
	Department                 string //
	Title                      string //
	Office                     string //
	OfficePhone                string //
	EmployeeType               string //
	FundingTypeOrAdmissionYear string //
	StudentCategoryPrimary     string //
	StudentCategoryDetail      string //
	StudentNationalityType     string //
	ResidentialCollege         string //
	StaffRole                  string //
	MailNickname               string //
	Tags                       string //
	CreatedAt                  string //
	UpdatedAt                  string //
}

// userInfosColumns holds the columns for the table user_infos.
var userInfosColumns = UserInfosColumns{
	Upn:                        "upn",
	DisplayName:                "display_name",
	UniqueName:                 "unique_name",
	SamAccountName:             "sam_account_name",
	Email:                      "email",
	SchoolStatus:               "school_status",
	IdentityType:               "identity_type",
	EmployeeId:                 "employee_id",
	Name:                       "name",
	Department:                 "department",
	Title:                      "title",
	Office:                     "office",
	OfficePhone:                "office_phone",
	EmployeeType:               "employee_type",
	FundingTypeOrAdmissionYear: "funding_type_or_admission_year",
	StudentCategoryPrimary:     "student_category_primary",
	StudentCategoryDetail:      "student_category_detail",
	StudentNationalityType:     "student_nationality_type",
	ResidentialCollege:         "residential_college",
	StaffRole:                  "staff_role",
	MailNickname:               "mail_nickname",
	Tags:                       "tags",
	CreatedAt:                  "created_at",
	UpdatedAt:                  "updated_at",
}

// NewUserInfosDao creates and returns a new DAO object for table data access.
func NewUserInfosDao(handlers ...gdb.ModelHandler) *UserInfosDao {
	return &UserInfosDao{
		group:    "default",
		table:    "user_infos",
		columns:  userInfosColumns,
		handlers: handlers,
	}
}

// DB retrieves and returns the underlying raw database management object of the current DAO.
func (dao *UserInfosDao) DB() gdb.DB {
	return g.DB(dao.group)
}

// Table returns the table name of the current DAO.
func (dao *UserInfosDao) Table() string {
	return dao.table
}

// Columns returns all column names of the current DAO.
func (dao *UserInfosDao) Columns() UserInfosColumns {
	return dao.columns
}

// Group returns the database configuration group name of the current DAO.
func (dao *UserInfosDao) Group() string {
	return dao.group
}

// Ctx creates and returns a Model for the current DAO. It automatically sets the context for the current operation.
func (dao *UserInfosDao) Ctx(ctx context.Context) *gdb.Model {
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
func (dao *UserInfosDao) Transaction(ctx context.Context, f func(ctx context.Context, tx gdb.TX) error) (err error) {
	return dao.Ctx(ctx).Transaction(ctx, f)
}
