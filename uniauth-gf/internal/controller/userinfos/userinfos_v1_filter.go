package userinfos

import (
	"context"
	"fmt"
	"math"
	"strings"

	"github.com/gogf/gf/v2/database/gdb"
	"github.com/gogf/gf/v2/errors/gerror"
	"github.com/gogf/gf/v2/frame/g"

	v1 "uniauth-gf/api/userinfos/v1"
	"uniauth-gf/internal/dao"
	"uniauth-gf/internal/model/entity"
)

// 字段白名单，防止用户查询任意字段
var allowedFields = g.MapStrStr{
	"upn":                        dao.UserinfosUserInfos.Columns().Upn,
	"email":                      dao.UserinfosUserInfos.Columns().Email,
	"displayName":                dao.UserinfosUserInfos.Columns().DisplayName,
	"schoolStatus":               dao.UserinfosUserInfos.Columns().SchoolStatus,
	"identityType":               dao.UserinfosUserInfos.Columns().IdentityType,
	"employeeId":                 dao.UserinfosUserInfos.Columns().EmployeeId,
	"name":                       dao.UserinfosUserInfos.Columns().Name,
	"tags":                       dao.UserinfosUserInfos.Columns().Tags,
	"department":                 dao.UserinfosUserInfos.Columns().Department,
	"title":                      dao.UserinfosUserInfos.Columns().Title,
	"office":                     dao.UserinfosUserInfos.Columns().Office,
	"officePhone":                dao.UserinfosUserInfos.Columns().OfficePhone,
	"employeeType":               dao.UserinfosUserInfos.Columns().EmployeeType,
	"fundingTypeOrAdmissionYear": dao.UserinfosUserInfos.Columns().FundingTypeOrAdmissionYear,
	"studentCategoryPrimary":     dao.UserinfosUserInfos.Columns().StudentCategoryPrimary,
	"studentCategoryDetail":      dao.UserinfosUserInfos.Columns().StudentCategoryDetail,
	"studentNationalityType":     dao.UserinfosUserInfos.Columns().StudentNationalityType,
	"residentialCollege":         dao.UserinfosUserInfos.Columns().ResidentialCollege,
	"staffRole":                  dao.UserinfosUserInfos.Columns().StaffRole,
	"samAccountName":             dao.UserinfosUserInfos.Columns().SamAccountName,
	"mailNickname":               dao.UserinfosUserInfos.Columns().MailNickname,
	"createdAt":                  dao.UserinfosUserInfos.Columns().CreatedAt,
	"updatedAt":                  dao.UserinfosUserInfos.Columns().UpdatedAt,
}

// 支持排序的字段（加了索引的）
var sortableFields = g.MapStrBool{
	"upn":        true,
	"email":      true,
	"employeeId": true,
	"name":       true,
	"department": true,
	"createdAt":  true,
	"updatedAt":  true,
}

func (c *ControllerV1) Filter(ctx context.Context, req *v1.FilterReq) (res *v1.FilterRes, err error) {
	// 设置默认分页参数
	if req.Pagination == nil {
		req.Pagination = &v1.PaginationReq{
			Page:     1,
			PageSize: 20,
		}
	}

	// 创建查询模型
	model := dao.UserinfosUserInfos.Ctx(ctx)

	// 应用过滤条件
	model, err = c.applyFilterGroup(model, req.Filter)
	if err != nil {
		return nil, gerror.Wrap(err, "应用过滤条件失败")
	}

	// 获取总数（在排序和分页之前）
	total, err := model.Count()
	if err != nil {
		return nil, gerror.Wrap(err, "获取总数失败")
	}

	// 检查是否请求全部数据
	if req.Pagination.All {
		// 重置分页参数为全部数据
		req.Pagination.Page = 1
		req.Pagination.PageSize = total
	} else {
		// 检查分页参数
		if req.Pagination.PageSize > 1000 {
			return nil, gerror.New("分页大小不能超过1000")
		}
	}

	// 应用排序
	if len(req.Sort) > 0 {
		for _, sort := range req.Sort {
			if !sortableFields[sort.Field] {
				return nil, gerror.Newf("字段 '%s' 不支持排序", sort.Field)
			}
			dbField, exists := allowedFields[sort.Field]
			if !exists {
				return nil, gerror.Newf("无效的排序字段: %s", sort.Field)
			}

			orderDirection := "ASC"
			if sort.Order == "desc" {
				orderDirection = "DESC"
			}
			model = model.Order(fmt.Sprintf("%s %s", dbField, orderDirection))
		}
	} else {
		// 默认按创建时间倒序排列
		model = model.OrderDesc(dao.UserinfosUserInfos.Columns().CreatedAt)
	}

	// 应用分页（如果不是查询全部）
	if !req.Pagination.All {
		offset := (req.Pagination.Page - 1) * req.Pagination.PageSize
		model = model.Limit(req.Pagination.PageSize).Offset(offset)
	}

	// 构建响应
	res = &v1.FilterRes{
		Total:      total,
		Page:       req.Pagination.Page,
		PageSize:   req.Pagination.PageSize,
		TotalPages: int(math.Ceil(float64(total) / float64(req.Pagination.PageSize))),
		IsAll:      req.Pagination.All,
	}

	// 返回详细用户信息
	var userInfos []entity.UserinfosUserInfos
	err = model.Scan(&userInfos)
	if err != nil {
		return nil, gerror.Wrap(err, "查询用户详细信息失败")
	}
	// 提取UPN列表
	upns := make([]string, len(userInfos))
	for i, info := range userInfos {
		upns[i] = info.Upn
	}
	res.UserUpns = upns
	
	if req.Verbose {
		res.UserInfos = userInfos
	}

	return res, nil
}

// applyFilterGroup 递归应用过滤条件组
func (c *ControllerV1) applyFilterGroup(model *gdb.Model, group *v1.FilterGroup) (*gdb.Model, error) {
	// 未声明规则则直接跳过过滤
	if group == nil {
		return model, nil
	}

	// 构建当前组的条件
	var groupConditions g.ArrayStr
	var groupArgs []interface{}

	// 处理条件列表
	for _, condition := range group.Conditions {
		conditionStr, args, err := c.buildCondition(condition)
		if err != nil {
			return nil, err
		}
		groupConditions = append(groupConditions, conditionStr)
		groupArgs = append(groupArgs, args...)
	}

	// 递归处理嵌套组
	for _, subGroup := range group.Groups {
		subConditionStr, subArgs, err := c.buildGroupCondition(subGroup)
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

// buildGroupCondition 构建嵌套组的条件字符串
func (c *ControllerV1) buildGroupCondition(group *v1.FilterGroup) (string, []interface{}, error) {
	if group == nil {
		return "", nil, nil
	}

	var conditions []string
	var args []interface{}

	// 处理条件列表
	for _, condition := range group.Conditions {
		conditionStr, condArgs, err := c.buildCondition(condition)
		if err != nil {
			return "", nil, err
		}
		if conditionStr != "" {
			conditions = append(conditions, conditionStr)
			args = append(args, condArgs)
		}
	}

	// 递归处理嵌套组
	for _, subGroup := range group.Groups {
		subConditionStr, subArgs, err := c.buildGroupCondition(subGroup)
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

// buildCondition 构建单个过滤条件
func (c *ControllerV1) buildCondition(condition *v1.FilterCondition) (string, []interface{}, error) {
	// 验证字段是否在白名单中
	dbField, exists := allowedFields[condition.Field]
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
		// 此时 condition.Value 的类型应当是 []interface{}
		// 返回示例：
		// user_infos IN (?,?,?)
		// []interface{}{"value1", "value2", "value3"}
		// err
		values := condition.Value.Interfaces()
		if len(values) == 0 {
			return "", nil, gerror.Newf("%s操作的值不能为空", condition.Op)
		}
		placeholders := strings.Repeat("?,", len(values))
		placeholders = placeholders[:len(placeholders)-1] // 移除最后的逗号

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
