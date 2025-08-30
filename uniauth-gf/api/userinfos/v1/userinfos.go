package v1

import (
	"time"

	"github.com/gogf/gf/v2/frame/g"
)

type GetOneReq struct {
	g.Meta `path:"/userinfo/:upn" tags:"UserInfo" method:"get" summary:"根据UPN，返回用户的所有信息。"`
	Upn    string `v:"required" dc:"UPN"`
}

type GetOneRes struct {
	Upn                        string    `json:"upn"`
	DisplayName                string    `json:"displayName"`
	UniqueName                 string    `json:"uniqueName"`
	SamAccountName             string    `json:"samAccountName"`
	Email                      string    `json:"email"`
	SchoolStatus               string    `json:"schoolStatus"`
	IdentityType               string    `json:"identityType"`
	EmployeeId                 string    `json:"employeeId"`
	Name                       string    `json:"name"`
	Department                 string    `json:"department"`
	Title                      string    `json:"title"`
	Office                     string    `json:"office"`
	OfficePhone                string    `json:"officePhone"`
	EmployeeType               string    `json:"employeeType"`
	FundingTypeOrAdmissionYear string    `json:"fundingTypeOrAdmissionYear"`
	StudentCategoryPrimary     string    `json:"studentCategoryPrimary"`
	StudentCategoryDetail      string    `json:"studentCategoryDetail"`
	StudentNationalityType     string    `json:"studentNationalityType"`
	ResidentialCollege         string    `json:"residentialCollege"`
	StaffRole                  string    `json:"staffRole"`
	MailNickname               string    `json:"mailNickname"`
	Tags                       []string  `json:"tags"`
	CreatedAt                  time.Time `json:"createdAt"`
	UpdatedAt                  time.Time `json:"updatedAt"`
}
