package config

import (
	"context"

	"github.com/gogf/gf/v2/errors/gerror"

	v1 "uniauth-gf/api/config/v1"
	"uniauth-gf/internal/dao"
)

func (c *ControllerV1) GetAllLangs(ctx context.Context, req *v1.GetAllLangsReq) (res *v1.GetAllLangsRes, err error) {
	// 查询所有不重复的语言代码
	result, err := dao.ConfigInternationalization.Ctx(ctx).Distinct().Fields("lang_code").Array()
	if err != nil {
		return nil, gerror.Wrap(err, "查询语言列表失败")
	}

	// 将结果转换为字符串数组
	var langs []string
	for _, item := range result {
		langs = append(langs, item.String())
	}

	return &v1.GetAllLangsRes{
		Langs: langs,
	}, nil
}
