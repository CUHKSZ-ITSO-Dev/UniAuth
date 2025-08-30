// =================================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT.
// =================================================================================

package do

import (
	"github.com/gogf/gf/v2/frame/g"
	"github.com/gogf/gf/v2/os/gtime"
)

// UserInfo is the golang structure of table user_info for DAO operations like Where/Data.
type UserInfo struct {
	g.Meta                     `orm:"table:user_info, do:true"`
	Upn                        interface{} //
	DisplayName                interface{} //
	UniqueName                 interface{} //
	SamAccountName             interface{} //
	Email                      interface{} //
	SchoolStatus               interface{} //
	IdentityType               interface{} //
	EmployeeId                 interface{} //
	Name                       interface{} //
	Department                 interface{} //
	Title                      interface{} //
	Office                     interface{} //
	OfficePhone                interface{} //
	EmployeeType               interface{} //
	FundingTypeOrAdmissionYear interface{} //
	StudentCategoryPrimary     interface{} //
	StudentCategoryDetail      interface{} //
	StudentNationalityType     interface{} //
	ResidentialCollege         interface{} //
	StaffRole                  interface{} //
	MailNickname               interface{} //
	Tags                       []string    //
	CreatedAt                  *gtime.Time //
	UpdatedAt                  *gtime.Time //
}
