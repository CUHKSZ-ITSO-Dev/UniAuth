package config

import (
	"context"
	"fmt"
	"math"
	"strings"

	"github.com/gogf/gf/v2/database/gdb"
	"github.com/gogf/gf/v2/errors/gerror"
	"github.com/gogf/gf/v2/frame/g"

	v1 "uniauth-gf/api/config/v1"
	"uniauth-gf/internal/dao"
)

// 字段白名单，防止用户查询任意字段
var allowedI18nFields = g.MapStrStr{
	"langCode":    dao.ConfigInternationalization.Columns().LangCode,
	"key":         dao.ConfigInternationalization.Columns().Key,
	"value":       dao.ConfigInternationalization.Columns().Value,
	"description": dao.ConfigInternationalization.Columns().Description,
	"createdAt":   dao.ConfigInternationalization.Columns().CreatedAt,
	"updatedAt":   dao.ConfigInternationalization.Columns().UpdatedAt,
}

// 支持排序的字段（加了索引的）
var sortableI18nFields = g.MapStrBool{
	"langCode":  true,
	"key":       true,
	"createdAt": true,
	"updatedAt": true,
}

func (c *ControllerV1) FilterI18n(ctx context.Context, req *v1.FilterI18nReq) (res *v1.FilterI18nRes, err error) {
	// 使用事务进行查询操作，确保数据一致性
	err = g.DB().Transaction(ctx, func(ctx context.Context, tx gdb.TX) error {
		// 设置默认分页参数
		if req.Pagination == nil {
			req.Pagination = &v1.I18nPaginationReq{
				Page:     1,
				PageSize: 20,
			}
		}

		// 创建查询模型
		model := tx.Model(dao.ConfigInternationalization.Table()).Ctx(ctx)

		// 应用过滤条件
		model, err = c.applyI18nFilterGroup(model, req.Filter)
		if err != nil {
			return gerror.Wrap(err, "应用过滤条件失败")
		}

		// 获取总数（在排序和分页之前）
		total, err := model.Count()
		if err != nil {
			return gerror.Wrap(err, "获取总数失败")
		}

		// 检查是否请求全部数据
		if req.Pagination.All {
			// 安全检查：防止返回过多数据
			const maxAllLimit = 10000
			if total > maxAllLimit {
				return gerror.Newf("查询结果过多(%d)，超过最大限制(%d)，请添加更精确的过滤条件", total, maxAllLimit)
			}
			// 重置分页参数为全部数据
			req.Pagination.Page = 1
			req.Pagination.PageSize = total
		} else {
			// 检查分页参数
			if req.Pagination.PageSize > 1000 {
				return gerror.New("分页大小不能超过1000")
			}
		}

		// 应用排序
		if len(req.Sort) > 0 {
			for _, sort := range req.Sort {
				if !sortableI18nFields[sort.Field] {
					return gerror.Newf("字段 %s 不支持排序", sort.Field)
				}
				dbField, exists := allowedI18nFields[sort.Field]
				if !exists {
					return gerror.Newf("无效的排序字段: %s", sort.Field)
				}

				orderDirection := "ASC"
				if sort.Order == "desc" {
					orderDirection = "DESC"
				}
				model = model.Order(fmt.Sprintf("%s %s", dbField, orderDirection))
			}
		} else {
			// 默认按创建时间倒序排列
			model = model.OrderDesc(dao.ConfigInternationalization.Columns().CreatedAt)
		}

		// 应用分页（如果不是查询全部）
		if !req.Pagination.All {
			offset := (req.Pagination.Page - 1) * req.Pagination.PageSize
			model = model.Limit(req.Pagination.PageSize).Offset(offset)
		}

		// 构建响应
		res = &v1.FilterI18nRes{
			Total:      total,
			Page:       req.Pagination.Page,
			PageSize:   req.Pagination.PageSize,
			TotalPages: int(math.Ceil(float64(total) / float64(req.Pagination.PageSize))),
			IsAll:      req.Pagination.All,
		}

		if req.Verbose {
			// 返回详细i18n信息
			var i18nItems []v1.I18nItem
			err = model.Scan(&i18nItems)
			if err != nil {
				return gerror.Wrap(err, "查询i18n详细信息失败")
			}
			res.I18nItems = i18nItems

			// 提取键列表
			keys := make([]string, len(i18nItems))
			for i, item := range i18nItems {
				keys[i] = item.Key
			}
			res.I18nKeys = keys
		} else {
			// 仅返回键列表
			var keys []string
			err = model.Fields(dao.ConfigInternationalization.Columns().Key).Scan(&keys)
			if err != nil {
				return gerror.Wrap(err, "查询i18n键列表失败")
			}
			res.I18nKeys = keys
		}

		return nil
	})

	if err != nil {
		return nil, err
	}

	return res, nil
}

// applyI18nFilterGroup 递归应用过滤条件组
func (c *ControllerV1) applyI18nFilterGroup(model *gdb.Model, group *v1.I18nFilterGroup) (*gdb.Model, error) {
	// 未声明规则则直接跳过过滤
	if group == nil {
		return model, nil
	}

	// 构建当前组的条件
	var groupConditions g.ArrayStr
	var groupArgs []interface{}

	// 处理条件列表
	for _, condition := range group.Conditions {
		conditionStr, args, err := c.buildI18nCondition(condition)
		if err != nil {
			return nil, err
		}
		groupConditions = append(groupConditions, conditionStr)
		groupArgs = append(groupArgs, args...)
	}

	// 递归处理嵌套组
	for _, subGroup := range group.Groups {
		subConditionStr, subArgs, err := c.buildI18nGroupCondition(subGroup)
		if err != nil {
			return nil, err
		}
		if subConditionStr != "" {
			groupConditions = append(groupConditions, subConditionStr)
			groupArgs = append(groupArgs, subArgs...)
		}
	}

	// 如果没有任何条件，直接返回
	if len(groupConditions) == 0 {
		return model, nil
	}

	// 根据逻辑关系连接条件
	logic := strings.ToUpper(group.Logic)
	if logic != "AND" && logic != "OR" {
		logic = "AND" // 默认使用AND
	}

	// 构建完整的条件字符串
	fullCondition := "(" + strings.Join(groupConditions, " "+logic+" ") + ")"

	return model.Where(fullCondition, groupArgs...), nil
}

// buildI18nGroupCondition 构建嵌套组的条件字符串
func (c *ControllerV1) buildI18nGroupCondition(group *v1.I18nFilterGroup) (string, []interface{}, error) {
	if group == nil {
		return "", nil, nil
	}

	var conditions []string
	var args []interface{}

	// 处理条件列表
	for _, condition := range group.Conditions {
		conditionStr, condArgs, err := c.buildI18nCondition(condition)
		if err != nil {
			return "", nil, err
		}
		if conditionStr != "" {
			conditions = append(conditions, conditionStr)
			args = append(args, condArgs...)
		}
	}

	// 递归处理嵌套组
	for _, subGroup := range group.Groups {
		subConditionStr, subArgs, err := c.buildI18nGroupCondition(subGroup)
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

	// 根据逻辑关系连接条件
	logic := strings.ToUpper(group.Logic)
	if logic != "AND" && logic != "OR" {
		logic = "AND" // 默认使用AND
	}

	// 构建完整的条件字符串，用括号包裹以确保逻辑正确
	result := "(" + strings.Join(conditions, " "+logic+" ") + ")"
	return result, args, nil
}

// buildI18nCondition 构建单个过滤条件
func (c *ControllerV1) buildI18nCondition(condition *v1.I18nFilterCondition) (string, []interface{}, error) {
	// 验证字段是否在白名单中
	dbField, exists := allowedI18nFields[condition.Field]
	if !exists {
		return "", nil, gerror.Newf("无效的过滤字段: %s", condition.Field)
	}

	// 根据操作符构建条件
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
		return fmt.Sprintf("%s LIKE ?", dbField), []interface{}{g.NewVar("%" + condition.Value.String() + "%")}, nil
	case "notcontains":
		return fmt.Sprintf("%s NOT LIKE ?", dbField), []interface{}{g.NewVar("%" + condition.Value.String() + "%")}, nil
	case "startswith":
		return fmt.Sprintf("%s LIKE ?", dbField), []interface{}{g.NewVar(condition.Value.String() + "%")}, nil
	case "endswith":
		return fmt.Sprintf("%s LIKE ?", dbField), []interface{}{g.NewVar("%" + condition.Value.String())}, nil
	case "in", "notin":
		// 处理IN和NOT IN操作，支持数组和切片
		values := condition.Value.Interfaces()
		if len(values) == 0 {
			return "", nil, gerror.Newf("IN/NOT IN 操作符的值不能为空")
		}
		placeholders := strings.Repeat("?,", len(values))
		placeholders = placeholders[:len(placeholders)-1] // 移除最后的逗号

		op := "IN"
		if condition.Op == "notin" {
			op = "NOT IN"
		}
		return fmt.Sprintf("%s %s (%s)", dbField, op, placeholders), values, nil
	case "isnull":
		return fmt.Sprintf("%s IS NULL", dbField), []interface{}{}, nil
	case "isnotnull":
		return fmt.Sprintf("%s IS NOT NULL", dbField), []interface{}{}, nil
	default:
		return "", nil, gerror.Newf("不支持的操作符: %s", condition.Op)
	}
}
