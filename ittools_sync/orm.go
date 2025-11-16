package main

import (
	"context"
	"time"

	"github.com/lib/pq"
	"gorm.io/gorm/clause"
)

type UserinfosUserInfos struct {
	Upn                        string
	Email                      string
	DisplayName                string
	SamAccountName             string
	SchoolStatus               string
	IdentityType               string
	EmployeeID                 string
	Name                       string
	Department                 string
	Title                      string
	Office                     string
	OfficePhone                string
	EmployeeType               string
	FundingTypeOrAdmissionYear string
	StudentCategoryPrimary     string
	StudentCategoryDetail      string
	StudentNationalityType     string
	ResidentialCollege         string
	StaffRole                  string
	MailNickname               string
	Tags                       pq.StringArray `gorm:"type:text[]"`
	CreatedAt                  time.Time
	UpdatedAt                  time.Time
}

func UpdateRecord(ctx context.Context, record *UserinfosUserInfos) error {
	return db.WithContext(ctx).Clauses(clause.OnConflict{
		Columns: []clause.Column{{Name: "upn"}}, // 冲突键
		DoUpdates: clause.AssignmentColumns([]string{ // 更新所有其他字段
			"email", "display_name", "sam_account_name", "school_status",
			"identity_type", "employee_id", "name", "department", "title",
			"office", "office_phone", "employee_type", "funding_type_or_admission_year",
			"student_category_primary", "student_category_detail",
			"student_nationality_type", "residential_college", "staff_role",
			"mail_nickname", "tags", "updated_at",
		}),
	}).Create(record).Error
}
