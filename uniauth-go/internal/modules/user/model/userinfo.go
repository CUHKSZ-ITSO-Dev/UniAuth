package model

import (
	"time"
)

// ========== 用户管理模型 ==========
// 只支持 PostgreSQL，因为要用 TEXT[] 类型

// 存储用户所有SSO信息
type UserInfo struct {
	UPN                        string `json:"upn" gorm:"size:200; primaryKey;"`
	DisplayName                string `json:"displayName" gorm:"size:100;"`
	UniqueName                 string `json:"uniqueName" gorm:"size:100;"`
	SamAccountName             string `json:"samAccountName" gorm:"size:100;"`
	Email                      string `json:"email" gorm:"size:200;"`
	SchoolStatus               string `json:"schoolStatus" gorm:"size:50;"`
	IdentityType               string `json:"identityType" gorm:"size:50;"`
	EmployeeID                 string `json:"employeeID" gorm:"size:20;"`
	Name                       string `json:"name" gorm:"size:200;"`
	Department                 string `json:"department" gorm:"size:100;"`
	Title                      string `json:"title" gorm:"size:100;"`
	Office                     string `json:"office" gorm:"size:100;"`
	OfficePhone                string `json:"officePhone" gorm:"size:50;"`
	EmployeeType               string `json:"employeeType" gorm:"size:50;"`
	FundingTypeOrAdmissionYear string `json:"fundingTypeOrAdmissionYear" gorm:"size:100;"`
	StudentCategoryPrimary     string `json:"studentCategoryPrimary" gorm:"size:50;"`
	StudentCategoryDetail      string `json:"studentCategoryDetail" gorm:"size:50;"`
	StudentNationalityType     string `json:"studentNationalityType" gorm:"size:200;"`
	ResidentialCollege         string `json:"residentialCollege" gorm:"size:100;"`
	StaffRole                  string `json:"staffRole" gorm:"size:50;"`
	MailNickname               string `json:"mailNickname" gorm:"size:200;"`

	Tags []string `json:"tags" gorm:"type:text[]; index:,gin;"`

	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}
