package config

import (
	"context"
	"io"

	"github.com/gogf/gf/v2/database/gdb"
	"github.com/gogf/gf/v2/encoding/gjson"
	"github.com/gogf/gf/v2/errors/gerror"
	"github.com/gogf/gf/v2/frame/g"
	"github.com/gogf/gf/v2/os/gtime"

	v1 "uniauth-gf/api/config/v1"
	"uniauth-gf/internal/dao"
	"uniauth-gf/internal/model/entity"
)

func (c *ControllerV1) BatchUploadI18n(ctx context.Context, req *v1.BatchUploadI18nReq) (res *v1.BatchUploadI18nRes, err error) {
	// 检查输入参数，确保app_id不为空
	if req.AppId == "" {
		return nil, gerror.New("app_id不能为空")
	}

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
				AppId:       req.AppId,
				ZhCn:        "",
				EnUs:        "",
				Description: "",
				CreatedAt:   now,
				UpdatedAt:   now,
			}
			// 按语言代码填充
			switch req.Lang {
			case "zh-CN":
				item.ZhCn = j.Var().String()
			case "en-US":
				item.EnUs = j.Var().String()
			}
			list = append(list, item)
		}
	}

	flatten(json, "")

	// 批量插入或更新数据库
	if len(list) > 0 {
		// 提取所有key
		keys := make([]string, len(list))
		for i, item := range list {
			keys[i] = item.Key
		}

		// 批量查询已存在的记录
		var existingRecords []*entity.ConfigInternationalization
		err = dao.ConfigInternationalization.Ctx(ctx).
			WhereIn("key", keys).
			Where("app_id", req.AppId).
			Scan(&existingRecords)
		if err != nil {
			return nil, gerror.Wrap(err, "批量查询数据失败")
		}

		// 现有记录
		existingMap := make(map[string]*entity.ConfigInternationalization)
		for _, record := range existingRecords {
			existingMap[record.Key] = record
		}

		// 分离需要插入和更新的数据
		toInsert := make([]*entity.ConfigInternationalization, 0)
		toUpdate := make([]*entity.ConfigInternationalization, 0)
		previewData := make(map[string]v1.PreviewData)

		for _, item := range list {
			if existing, ok := existingMap[item.Key]; ok {
				// 检查是否真的需要更新
				needUpdate := false
				var oldValue, newValue string

				switch req.Lang {
				case "zh-CN":
					oldValue = existing.ZhCn
					newValue = item.ZhCn
					if oldValue != newValue {
						needUpdate = true
					}
				case "en-US":
					oldValue = existing.EnUs
					newValue = item.EnUs
					if oldValue != newValue {
						needUpdate = true
					}
				}

				if needUpdate {
					toUpdate = append(toUpdate, item)
					previewData[item.Key] = v1.PreviewData{
						Key:      item.Key,
						OldValue: oldValue,
						NewValue: newValue,
					}
				}
			} else {
				// 新增的项
				toInsert = append(toInsert, item)
				var newValue string
				switch req.Lang {
				case "zh-CN":
					newValue = item.ZhCn
				case "en-US":
					newValue = item.EnUs
				}
				previewData[item.Key] = v1.PreviewData{
					Key:      item.Key,
					OldValue: "",
					NewValue: newValue,
				}
			}
		}

		// 预览模式，只返回预览数据，不执行数据库操作
		if req.Preview {
			res = &v1.BatchUploadI18nRes{
				OK:          true,
				Count:       len(toInsert) + len(toUpdate),
				PreviewData: previewData,
			}
			return res, nil
		}

		// 执行实际的数据库操作
		insertCount := 0
		updateCount := 0

		// 批量插入新数据
		if len(toInsert) > 0 {
			_, err = dao.ConfigInternationalization.Ctx(ctx).Data(toInsert).Insert()
			if err != nil {
				return nil, gerror.Wrap(err, "批量插入数据失败")
			}
			insertCount = len(toInsert)
		}

		// 批量更新已存在的数据
		if len(toUpdate) > 0 {
			err = g.DB().Transaction(ctx, func(ctx context.Context, tx gdb.TX) error {
				for _, item := range toUpdate {
					updateData := g.Map{
						"updated_at": gtime.Now(),
					}
					switch req.Lang {
					case "zh-CN":
						updateData["zh_cn"] = item.ZhCn
					case "en-US":
						updateData["en_us"] = item.EnUs
					}
					_, err := tx.Model(dao.ConfigInternationalization.Table()).
						Where("key", item.Key).
						Where("app_id", req.AppId).
						Update(updateData)
					if err != nil {
						return err
					}
				}
				return nil
			})
			if err != nil {
				return nil, gerror.Wrap(err, "批量更新数据失败")
			}
			updateCount = len(toUpdate)
		}

		res = &v1.BatchUploadI18nRes{
			OK:    true,
			Count: insertCount + updateCount,
		}
	} else {
		res = &v1.BatchUploadI18nRes{
			OK:    true,
			Count: 0,
		}
	}

	return res, nil
}
