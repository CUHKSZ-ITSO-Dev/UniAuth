package config

import (
	"context"
	"regexp"
	"strings"

	"github.com/gogf/gf/v2/database/gdb"
	"github.com/gogf/gf/v2/errors/gerror"

	v1 "uniauth-gf/api/config/v1"
	"uniauth-gf/internal/dao"
	"uniauth-gf/internal/model/entity"
)

func (c *ControllerV1) AddI18nItem(ctx context.Context, req *v1.AddI18nItemReq) (res *v1.AddI18nItemRes, err error) {
	// 检查输入参数，确保key不为空且必须是用至少一个点分割的字符串格式，且每个部分只能是字母和下划线的组合
	if req.Key == "" {
		return nil, gerror.New("key不能为空")
	}

	// 验证key格式：至少包含一个点，且每个部分只能是字母和下划线组合
	parts := strings.Split(req.Key, ".")
	if len(parts) < 2 {
		return nil, gerror.New("key格式错误，必须包含至少一个点")
	}

	// 预编译正则表达式，避免在循环中重复编译
	validPartRegex := regexp.MustCompile(`^[a-zA-Z_]+$`)

	for _, part := range parts {
		if part == "" {
			return nil, gerror.New("key格式错误，不能包含空的部分")
		}

		// 检查是否只包含字母和下划线
		if !validPartRegex.MatchString(part) {
			return nil, gerror.New("key格式错误，只能包含字母和下划线")
		}
	}

	err = dao.ConfigInternationalization.Transaction(ctx, func(ctx context.Context, tx gdb.TX) error {
		// 先检查是否已存在 key
		var existingConfig *entity.ConfigInternationalization
		err := dao.ConfigInternationalization.Ctx(ctx).
			Where("key = ?", req.Key).
			LockUpdate().Scan(&existingConfig)
		if err != nil {
			return gerror.Wrap(err, "查询国际化配置失败")
		}

		if existingConfig != nil {
			return gerror.Newf("国际化配置已存在: key=%s", req.Key)
		}

		// 添加新的国际化配置
		_, err = dao.ConfigInternationalization.Ctx(ctx).Data(&entity.ConfigInternationalization{
			Key:         req.Key,
			ZhCn:        req.ZhCn,
			EnUs:        req.EnUs,
			Description: req.Description,
		}).Insert()

		if err != nil {
			return gerror.Wrap(err, "添加国际化配置失败")
		}

		return nil
	})

	if err != nil {
		return nil, gerror.Wrap(err, "添加国际化配置失败")
	}

	return &v1.AddI18nItemRes{OK: true}, nil
}
