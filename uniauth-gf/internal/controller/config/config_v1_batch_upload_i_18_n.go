package config

import (
	"context"
	"io"

	"github.com/gogf/gf/v2/encoding/gjson"
	"github.com/gogf/gf/v2/errors/gerror"
	"github.com/gogf/gf/v2/os/gtime"

	v1 "uniauth-gf/api/config/v1"
	"uniauth-gf/internal/dao"
	"uniauth-gf/internal/model/entity"
)

func (c *ControllerV1) BatchUploadI18n(ctx context.Context, req *v1.BatchUploadI18nReq) (res *v1.BatchUploadI18nRes, err error) {
	file := req.File
	if file == nil {
		return nil, gerror.Newf("未获取到文件或文件上传失败")
	}
	f, err := file.Open()
	if err != nil {
		return nil, gerror.Wrap(err, "文件打开失败")
	}
	defer f.Close()
	content, err := io.ReadAll(f)
	if err != nil {
		return nil, gerror.Wrap(err, "文件读取失败")
	}

	// 解析 JSON
	json, err := gjson.DecodeToJson(content)
	if err != nil {
		return nil, gerror.Wrap(err, "JSON解析失败")
	}

	// 构造批量插入数据
	list := make([]*entity.ConfigInternationalization, 0)
	now := gtime.Now()

	var flatten func(j *gjson.Json, prefix string)
	flatten = func(j *gjson.Json, prefix string) {
		v := j.Var()
		if v.IsMap() {
			for key, val := range j.Map() {
				newPrefix := key
				if prefix != "" {
					newPrefix = prefix + "." + key
				}
				flatten(gjson.New(val), newPrefix)
			}
		} else if v.IsSlice() {
			// 数组不处理
		} else {
			item := &entity.ConfigInternationalization{
				Key:         prefix,
				ZhCn:        "",
				EnUs:        "",
				Description: "",
				CreatedAt:   now,
				UpdatedAt:   now,
			}
			// 按语言代码填充
			switch req.Lang {
			case "zh-CN":
				item.ZhCn = j.String()
			case "en-US":
				item.EnUs = j.String()
			}
			list = append(list, item)
		}
	}

	flatten(json, "")

	// 批量插入或更新数据库
	if len(list) > 0 {
		_, err = dao.ConfigInternationalization.Ctx(ctx).Data(list).OnConflict("key").Save()
		if err != nil {
			return nil, gerror.Wrap(err, "批量插入或更新失败")
		}
	}

	res = &v1.BatchUploadI18nRes{
		OK:    true,
		Count: len(list),
	}
	return res, nil
}
