package quotaPool

import (
	"context"
	"fmt"
	"strings"

	"github.com/gogf/gf/v2/database/gdb"
	"github.com/gogf/gf/v2/errors/gerror"
	"github.com/gogf/gf/v2/frame/g"

	v1 "uniauth-gf/api/quotaPool/v1"
	"uniauth-gf/internal/dao"
)

// 字段白名单，防止用户查询任意字段
var allowedFields = g.MapStrStr{
	"quotaPoolName":  dao.QuotapoolQuotaPool.Columns().QuotaPoolName,
	"cronCycle":      dao.QuotapoolQuotaPool.Columns().CronCycle,
	"regularQuota":   dao.QuotapoolQuotaPool.Columns().RegularQuota,
	"remainingQuota": dao.QuotapoolQuotaPool.Columns().RemainingQuota,
	"lastResetAt":    dao.QuotapoolQuotaPool.Columns().LastResetAt,
	"extraQuota":     dao.QuotapoolQuotaPool.Columns().ExtraQuota,
	"personal":       dao.QuotapoolQuotaPool.Columns().Personal,
	"disabled":       dao.QuotapoolQuotaPool.Columns().Disabled,
	"userinfosRules": dao.QuotapoolQuotaPool.Columns().UserinfosRules,
	"createdAt":      dao.QuotapoolQuotaPool.Columns().CreatedAt,
	"updatedAt":      dao.QuotapoolQuotaPool.Columns().UpdatedAt,
}

// 支持排序的字段
var sortableFields = g.MapStrBool{
	"quotaPoolName":  true,
	"cronCycle":      true,
	"regularQuota":   true,
	"remainingQuota": true,
	"lastResetAt":    true,
	"extraQuota":     true,
	"personal":       true,
	"disabled":       true,
	"createdAt":      true,
	"updatedAt":      true,
}

// ApplyQuotaPoolFilter 应用配额池过滤条件到查询模型
func ApplyQuotaPoolFilter(ctx context.Context, model *gdb.Model, filter *v1.FilterGroup) (*gdb.Model, error) {
	if filter == nil {
		return model, nil
	}

	return applyFilterGroup(model, filter)
}

// ValidateSortField 验证排序字段是否有效
func ValidateSortField(field string) error {
	if !sortableFields[field] {
		return gerror.Newf("字段 '%s' 不支持排序", field)
	}
	if _, exists := allowedFields[field]; !exists {
		return gerror.Newf("无效的排序字段: %s", field)
	}
	return nil
}

// GetDbFieldName 获取字段对应的数据库字段名
func GetDbFieldName(field string) (string, error) {
	dbField, exists := allowedFields[field]
	if !exists {
		return "", gerror.Newf("无效的字段: %s", field)
	}
	return dbField, nil
}

// applyFilterGroup 递归应用过滤条件组
func applyFilterGroup(model *gdb.Model, group *v1.FilterGroup) (*gdb.Model, error) {
	if group == nil {
		return model, nil
	}

	var groupConditions g.ArrayStr
	var groupArgs []interface{}

	// 处理条件列表
	for _, condition := range group.Conditions {
		conditionStr, args, err := buildCondition(condition)
		if err != nil {
			return nil, err
		}
		if conditionStr != "" {
			groupConditions = append(groupConditions, conditionStr)
			groupArgs = append(groupArgs, args...)
		}
	}

	// 递归处理嵌套组
	for _, subGroup := range group.Groups {
		subConditionStr, subArgs, err := buildGroupCondition(subGroup)
		if err != nil {
			return nil, err
		}
		if subConditionStr != "" {
			groupConditions = append(groupConditions, subConditionStr)
			groupArgs = append(groupArgs, subArgs...)
		}
	}

	if len(groupConditions) == 0 {
		return model, nil
	}

	// 根据逻辑关系连接条件
	logic := strings.ToUpper(group.Logic)
	if logic != "AND" && logic != "OR" {
		logic = "AND"
	}

	fullCondition := "(" + strings.Join(groupConditions, " "+logic+" ") + ")"
	return model.Where(fullCondition, groupArgs...), nil
}

// buildGroupCondition 构建嵌套组的条件字符串
func buildGroupCondition(group *v1.FilterGroup) (string, []interface{}, error) {
	if group == nil {
		return "", nil, nil
	}

	var conditions []string
	var args []interface{}

	for _, condition := range group.Conditions {
		conditionStr, condArgs, err := buildCondition(condition)
		if err != nil {
			return "", nil, err
		}
		if conditionStr != "" {
			conditions = append(conditions, conditionStr)
			args = append(args, condArgs...)
		}
	}

	for _, subGroup := range group.Groups {
		subConditionStr, subArgs, err := buildGroupCondition(subGroup)
		if err != nil {
			return "", nil, err
		}
		if subConditionStr != "" {
			conditions = append(conditions, subConditionStr)
			args = append(args, subArgs...)
		}
	}

	if len(conditions) == 0 {
		return "", nil, nil
	}

	logic := strings.ToUpper(group.Logic)
	if logic != "AND" && logic != "OR" {
		logic = "AND"
	}

	result := "(" + strings.Join(conditions, " "+logic+" ") + ")"
	return result, args, nil
}

// buildCondition 构建单个过滤条件
func buildCondition(condition *v1.FilterCondition) (string, []interface{}, error) {
	dbField, exists := allowedFields[condition.Field]
	if !exists {
		return "", nil, gerror.Newf("无效的过滤字段: %s", condition.Field)
	}

	switch condition.Op {
	case "eq":
		return fmt.Sprintf("%s = ?", dbField), []interface{}{condition.Value}, nil
	case "neq":
		return fmt.Sprintf("%s != ?", dbField), []interface{}{condition.Value}, nil
	case "gt":
		return fmt.Sprintf("%s > ?", dbField), []interface{}{condition.Value}, nil
	case "gte":
		return fmt.Sprintf("%s >= ?", dbField), []interface{}{condition.Value}, nil
	case "lt":
		return fmt.Sprintf("%s < ?", dbField), []interface{}{condition.Value}, nil
	case "lte":
		return fmt.Sprintf("%s <= ?", dbField), []interface{}{condition.Value}, nil
	case "like":
		return fmt.Sprintf("%s LIKE ?", dbField), []interface{}{condition.Value}, nil
	case "ilike":
		return fmt.Sprintf("%s ILIKE ?", dbField), []interface{}{condition.Value}, nil
	case "contains":
		return fmt.Sprintf("%s LIKE ?", dbField), []interface{}{"%" + condition.Value.String() + "%"}, nil
	case "notcontains":
		return fmt.Sprintf("%s NOT LIKE ?", dbField), []interface{}{"%" + condition.Value.String() + "%"}, nil
	case "startswith":
		return fmt.Sprintf("%s LIKE ?", dbField), []interface{}{condition.Value.String() + "%"}, nil
	case "endswith":
		return fmt.Sprintf("%s LIKE ?", dbField), []interface{}{"%" + condition.Value.String()}, nil
	case "in", "notin":
		values := condition.Value.Interfaces()
		if len(values) == 0 {
			return "", nil, gerror.Newf("%s操作的值不能为空", condition.Op)
		}
		placeholders := strings.Repeat("?,", len(values))
		placeholders = placeholders[:len(placeholders)-1]

		op := "IN"
		if condition.Op == "notin" {
			op = "NOT IN"
		}
		return fmt.Sprintf("%s %s (%s)", dbField, op, placeholders), values, nil
	case "isnull":
		return fmt.Sprintf("%s IS NULL", dbField), nil, nil
	case "isnotnull":
		return fmt.Sprintf("%s IS NOT NULL", dbField), nil, nil
	default:
		return "", nil, gerror.Newf("不支持的操作符: %s", condition.Op)
	}
}
