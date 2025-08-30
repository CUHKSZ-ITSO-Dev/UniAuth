// =================================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT.
// =================================================================================

package entity

import (
	"github.com/gogf/gf/v2/os/gtime"
)

// UserInfos is the golang structure for table user_infos.
type UserInfos struct {
	Upn                        string      `json:"upn"                        orm:"upn"                            description:""` //
	DisplayName                string      `json:"displayName"                orm:"display_name"                   description:""` //
	UniqueName                 string      `json:"uniqueName"                 orm:"unique_name"                    description:""` //
	SamAccountName             string      `json:"samAccountName"             orm:"sam_account_name"               description:""` //
	Email                      string      `json:"email"                      orm:"email"                          description:""` //
	SchoolStatus               string      `json:"schoolStatus"               orm:"school_status"                  description:""` //
	IdentityType               string      `json:"identityType"               orm:"identity_type"                  description:""` //
	EmployeeId                 string      `json:"employeeId"                 orm:"employee_id"                    description:""` //
	Name                       string      `json:"name"                       orm:"name"                           description:""` //
	Department                 string      `json:"department"                 orm:"department"                     description:""` //
	Title                      string      `json:"title"                      orm:"title"                          description:""` //
	Office                     string      `json:"office"                     orm:"office"                         description:""` //
	OfficePhone                string      `json:"officePhone"                orm:"office_phone"                   description:""` //
	EmployeeType               string      `json:"employeeType"               orm:"employee_type"                  description:""` //
	FundingTypeOrAdmissionYear string      `json:"fundingTypeOrAdmissionYear" orm:"funding_type_or_admission_year" description:""` //
	StudentCategoryPrimary     string      `json:"studentCategoryPrimary"     orm:"student_category_primary"       description:""` //
	StudentCategoryDetail      string      `json:"studentCategoryDetail"      orm:"student_category_detail"        description:""` //
	StudentNationalityType     string      `json:"studentNationalityType"     orm:"student_nationality_type"       description:""` //
	ResidentialCollege         string      `json:"residentialCollege"         orm:"residential_college"            description:""` //
	StaffRole                  string      `json:"staffRole"                  orm:"staff_role"                     description:""` //
	MailNickname               string      `json:"mailNickname"               orm:"mail_nickname"                  description:""` //
	Tags                       []string    `json:"tags"                       orm:"tags"                           description:""` //
	CreatedAt                  *gtime.Time `json:"createdAt"                  orm:"created_at"                     description:""` //
	UpdatedAt                  *gtime.Time `json:"updatedAt"                  orm:"updated_at"                     description:""` //
}
