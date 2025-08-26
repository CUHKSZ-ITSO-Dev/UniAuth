package service

import (
	"fmt"
	"strings"
	"uniauth/internal/modules/rbac/model"
	userModel "uniauth/internal/modules/user/model"

	"gorm.io/gorm"
)

// userinfoAllowedQueryFields 是一个白名单，用于防止SQL注入。
// 它将API暴露的字段名映射到数据库的列名。
var userinfoAllowedQueryFields = map[string]string{
	"upn":                        "upn",
	"displayName":                "display_name",
	"uniqueName":                 "unique_name",
	"samAccountName":             "sam_account_name",
	"email":                      "email",
	"schoolStatus":               "school_status",
	"identityType":               "identity_type",
	"employeeID":                 "employee_id",
	"name":                       "name",
	"department":                 "department",
	"title":                      "title",
	"office":                     "office",
	"officePhone":                "office_phone",
	"employeeType":               "employee_type",
	"fundingTypeOrAdmissionYear": "funding_type_or_admission_year",
	"studentCategoryPrimary":     "student_category_primary",
	"studentCategoryDetail":      "student_category_detail",
	"studentNationalityType":     "student_nationality_type",
	"residentialCollege":         "residential_college",
	"staffRole":                  "staff_role",
	"mailNickname":               "mail_nickname",
}

// UserInfoService 提供用户信息服务（即原 ITTools）
type UserInfoService struct {
	DB *gorm.DB
}

func NewUserInfoService(db *gorm.DB) *UserInfoService {
	return &UserInfoService{
		DB: db,
	}
}

// 根据给定的抽象规则去Userinfo中匹配
func (s *UserInfoService) GetUserUPNsByRule(rule *model.IttoolsRule) ([]string, error) {
	var upns []string
	query := s.DB.Model(&userModel.UserInfo{})

	if rule == nil || len(rule.Conditions) == 0 {
		return []string{}, nil
	}

	var conditions []string
	var values []interface{}

	for _, c := range rule.Conditions {
		// 通过白名单检查字段名，防止SQL注入
		dbField, ok := userinfoAllowedQueryFields[c.Field]
		if !ok {
			return nil, fmt.Errorf("不支持的查询字段: %s", c.Field)
		}

		var clause string
		switch c.Operator {
		case "equals":
			clause = fmt.Sprintf("%s = ?", dbField)
			values = append(values, c.Value)
		case "not_equals":
			clause = fmt.Sprintf("%s != ?", dbField)
			values = append(values, c.Value)
		case "contains":
			clause = fmt.Sprintf("%s LIKE ?", dbField)
			values = append(values, "%"+c.Value+"%")
		case "starts_with":
			clause = fmt.Sprintf("%s LIKE ?", dbField)
			values = append(values, c.Value+"%")
		case "ends_with":
			clause = fmt.Sprintf("%s LIKE ?", dbField)
			values = append(values, "%"+c.Value)
		default:
			return nil, fmt.Errorf("不支持的操作符: %s", c.Operator)
		}
		conditions = append(conditions, clause)
	}

	if len(conditions) > 0 {
		logicalOperator := " AND "
		if strings.ToUpper(rule.LogicalOperator) == "OR" {
			logicalOperator = " OR "
		}
		queryString := strings.Join(conditions, logicalOperator)
		query = query.Where(queryString, values...)
	}

	if err := query.Pluck("upn", &upns).Error; err != nil {
		return nil, fmt.Errorf("根据抽象组规则获取UPN失败: %w", err)
	}

	return upns, nil
}
