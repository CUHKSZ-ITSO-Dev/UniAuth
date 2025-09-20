package config

import (
	"context"
	"fmt"
	"math"

	"github.com/gogf/gf/v2/errors/gerror"
	"github.com/gogf/gf/v2/frame/g"

	v1 "uniauth-gf/api/config/v1"
	"uniauth-gf/internal/dao"
)

// 字段白名单
var allowedI18nFields = g.MapStrStr{
	"key":         dao.ConfigInternationalization.Columns().Key,
	"zh_cn":       dao.ConfigInternationalization.Columns().ZhCn,
	"en_us":       dao.ConfigInternationalization.Columns().EnUs,
	"description": dao.ConfigInternationalization.Columns().Description,
	"created_at":  dao.ConfigInternationalization.Columns().CreatedAt,
	"updated_at":  dao.ConfigInternationalization.Columns().UpdatedAt,
}

// 支持排序的字段（加了索引的）
var sortableI18nFields = g.MapStrBool{
	"key":        true,
	"zh_cn":      true,
	"en_us":      true,
	"created_at": true,
	"updated_at": true,
}

func (c *ControllerV1) FilterI18n(ctx context.Context, req *v1.FilterI18nReq) (res *v1.FilterI18nRes, err error) {
	// 设置默认分页参数
	if req.Pagination == nil {
		req.Pagination = &v1.I18nPaginationReq{
			Page:     1,
			PageSize: 20,
		}
	}

	model := dao.ConfigInternationalization.Ctx(ctx)

	// 根据关键词进行模糊匹配
	if req.Keyword != "" {
		keyword := "%" + req.Keyword + "%"
		model = model.WhereOrLike(dao.ConfigInternationalization.Columns().Key, keyword).
			WhereOrLike(dao.ConfigInternationalization.Columns().ZhCn, keyword).
			WhereOrLike(dao.ConfigInternationalization.Columns().EnUs, keyword).
			WhereOrLike(dao.ConfigInternationalization.Columns().Description, keyword)
	}

	// 获取总数
	total, err := model.Count()
	if err != nil {
		return nil, gerror.Wrap(err, "获取总数失败")
	}

	// 应用排序
	if len(req.Sort) > 0 {
		for _, sort := range req.Sort {
			if !sortableI18nFields[sort.Field] {
				return nil, gerror.Newf("字段 %s 不支持排序", sort.Field)
			}
			dbField, exists := allowedI18nFields[sort.Field]
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
		model = model.OrderDesc("created_at")
	}

	// 应用分页
	offset := (req.Pagination.Page - 1) * req.Pagination.PageSize
	model = model.Limit(req.Pagination.PageSize).Offset(offset)

	// 构建响应
	res = &v1.FilterI18nRes{
		Total:      total,
		Page:       req.Pagination.Page,
		PageSize:   req.Pagination.PageSize,
		TotalPages: int(math.Ceil(float64(total) / float64(req.Pagination.PageSize))),
	}

	if req.Verbose {
		// 返回详细i18n信息
		var i18nItems []v1.I18nItem
		err = model.Scan(&i18nItems)
		if err != nil {
			return nil, gerror.Wrap(err, "查询i18n详细信息失败")
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
		err = model.Fields("key").Scan(&keys)
		if err != nil {
			return nil, gerror.Wrap(err, "查询i18n键列表失败")
		}
		res.I18nKeys = keys
	}

	return res, nil
}
