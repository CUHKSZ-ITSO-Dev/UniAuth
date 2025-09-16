package config

import (
	"context"
	"strings"

	"github.com/gogf/gf/v2/encoding/gjson"
	"github.com/gogf/gf/v2/errors/gerror"

	v1 "uniauth-gf/api/config/v1"
	"uniauth-gf/internal/dao"
	"uniauth-gf/internal/model/entity"
)

// setNestedValue 将点分隔的key设置为嵌套结构的值
func setNestedValue(m map[string]any, key string, value string) {
	keys := strings.Split(key, ".")
	current := m

	// 遍历所有key，除了最后一个
	for i := 0; i < len(keys)-1; i++ {
		k := keys[i]
		if _, exists := current[k]; !exists {
			current[k] = make(map[string]any)
		}
		// 类型断言，确保是map类型
		if nextMap, ok := current[k].(map[string]any); ok {
			current = nextMap
		} else {
			// 如果不是map类型，需要重新创建
			current[k] = make(map[string]any)
			current = current[k].(map[string]any)
		}
	}

	// 设置最后一个key的值
	lastKey := keys[len(keys)-1]
	current[lastKey] = value
}

func (c *ControllerV1) GetI18nConfig(ctx context.Context, req *v1.GetI18nConfigReq) (res *v1.GetI18nConfigRes, err error) {
	// 查询指定语言的所有配置项
	var items []entity.ConfigInternationalization
	if err = dao.ConfigInternationalization.Ctx(ctx).Where("lang_code = ?", req.Lang).Scan(&items); err != nil {
		return nil, gerror.Wrap(err, "查询i18n配置失败")
	}

	// 构建嵌套JSON结构
	resultMap := make(map[string]any)

	for _, item := range items {
		// 将点分隔的key转换为嵌套结构
		setNestedValue(resultMap, item.Key, item.Value)
	}

	// 将map转换为gjson.Json并直接返回
	jsonObj := gjson.New(resultMap)

	return &v1.GetI18nConfigRes{
		Json: jsonObj,
	}, nil
}
