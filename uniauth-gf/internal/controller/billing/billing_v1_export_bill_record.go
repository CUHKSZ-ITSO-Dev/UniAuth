package billing

import (
	"context"
	"fmt"
	"time"

	_ "image/png"

	v1 "uniauth-gf/api/billing/v1"

	"github.com/gogf/gf/frame/g"
	"github.com/gogf/gf/v2/encoding/gjson"
	"github.com/gogf/gf/v2/errors/gerror"
	"github.com/shopspring/decimal"
	"github.com/xuri/excelize/v2"
)

func (c *ControllerV1) ExportBillRecord(ctx context.Context, req *v1.ExportBillRecordReq) (res *v1.ExportBillRecordRes, err error) {
	recordsPri, err := c.GetBillRecord(ctx, &v1.GetBillRecordReq{
		QuotaPool: req.QuotaPool,
		Svc:       req.Svc,
		Product:   req.Product,
		StartTime: req.StartTime,
		EndTime:   req.EndTime,
	})
	if err != nil {
		return nil, gerror.Wrap(err, "复用获取账单记录接口时失败")
	}
	records := recordsPri.Records

	f := excelize.NewFile()
	defer func() {
		if errClose := f.Close(); errClose != nil {
			err = gerror.Wrap(errClose, "Excel 文件关闭失败")
		}
	}()

	index, err := f.NewSheet(req.QuotaPool)
	if err != nil {
		return nil, gerror.Wrap(err, "Excel 新建工作表失败")
	}

	f.SetColWidth(req.QuotaPool, "B", "H", 30)
	f.SetColWidth(req.QuotaPool, "A", "A", 12)
	f.SetColWidth(req.QuotaPool, "I", "I", 12)

	// 插入校徽
	logoPath := "resource/public/cuhksz-logo-square.png"
	trueVal := true
	if err := f.AddPicture(req.QuotaPool, "E1", logoPath, &excelize.GraphicOptions{
		ScaleX:          0.26,
		ScaleY:          0.26,
		Positioning:     "oneCell",
		OffsetX:         30,
		OffsetY:         5,
		PrintObject:     &trueVal,
		LockAspectRatio: true,
	}); err != nil {
		g.Log().Warning(ctx, "无法加载校徽图像:", err)
	}

	// 设置第一行高度以容纳校徽
	f.SetRowHeight(req.QuotaPool, 1, 120)

	// Header - 机构信息
	// 创建标题样式
	titleStyle, err := f.NewStyle(&excelize.Style{
		Font: &excelize.Font{
			Bold: true,
			Size: 16,
		},
		Alignment: &excelize.Alignment{
			Horizontal: "center",
			Vertical:   "center",
		},
	})

	// 创建副标题样式
	subtitleStyle, err := f.NewStyle(&excelize.Style{
		Font: &excelize.Font{
			Bold: true,
			Size: 12,
		},
		Alignment: &excelize.Alignment{
			Horizontal: "center",
			Vertical:   "center",
		},
	})

	// 创建账单标题样式
	billTitleStyle, err := f.NewStyle(&excelize.Style{
		Font: &excelize.Font{
			Bold:  true,
			Size:  14,
			Color: "FF0000",
		},
		Alignment: &excelize.Alignment{
			Horizontal: "center",
			Vertical:   "center",
		},
		Fill: excelize.Fill{
			Type:    "pattern",
			Color:   []string{"F0F8FF"},
			Pattern: 1,
		},
	})

	// 学校名称放在第二行（校徽下面）
	f.SetCellValue(req.QuotaPool, "A2", "香港中文大学（深圳）")
	err = f.MergeCell(req.QuotaPool, "A2", "I2")
	f.SetCellStyle(req.QuotaPool, "A2", "I2", titleStyle)

	f.SetCellValue(req.QuotaPool, "A3", "The Chinese University of Hong Kong, Shenzhen")
	err = f.MergeCell(req.QuotaPool, "A3", "I3")
	f.SetCellStyle(req.QuotaPool, "A3", "I3", subtitleStyle)

	// 账单标题
	f.SetCellValue(req.QuotaPool, "A7", "正 式 账 单")
	err = f.MergeCell(req.QuotaPool, "A7", "I7")
	f.SetCellStyle(req.QuotaPool, "A7", "I7", billTitleStyle)

	// 生成账单编号和日期
	billNumber := fmt.Sprintf("BILL-%s-%s", req.QuotaPool, time.Now().Format("20060102150405"))
	generateDate := time.Now().Format("2006年01月02日")

	// 账单信息区域
	infoStyle, err := f.NewStyle(&excelize.Style{
		Font: &excelize.Font{
			Bold: true,
			Size: 11,
		},
		Alignment: &excelize.Alignment{
			Horizontal: "left",
			Vertical:   "center",
		},
	})

	// 创建边框样式
	borderCenterStyle, err := f.NewStyle(&excelize.Style{
		Alignment: &excelize.Alignment{
			Horizontal: "center",
			Vertical:   "center",
		},
		Border: []excelize.Border{
			{Type: "left", Style: 1, Color: "000000"},
			{Type: "right", Style: 1, Color: "000000"},
			{Type: "top", Style: 1, Color: "000000"},
			{Type: "bottom", Style: 1, Color: "000000"},
		},
	})

	// 账单详细信息
	f.SetCellValue(req.QuotaPool, "A9", "账单编号：")
	f.SetCellValue(req.QuotaPool, "B9", billNumber)
	f.SetCellValue(req.QuotaPool, "F9", "生成日期：")
	f.SetCellValue(req.QuotaPool, "G9", generateDate)
	f.SetCellStyle(req.QuotaPool, "A9", "I9", infoStyle)

	f.SetCellValue(req.QuotaPool, "A10", "配额池：")
	f.SetCellValue(req.QuotaPool, "B10", req.QuotaPool)
	f.SetCellValue(req.QuotaPool, "F10", "账单状态：")
	f.SetCellValue(req.QuotaPool, "G10", "正式账单")
	f.SetCellStyle(req.QuotaPool, "A10", "I10", infoStyle)

	// 添加"所有人"字段在配额池下面
	f.SetCellValue(req.QuotaPool, "A11", "所有人：")
	f.SetCellValue(req.QuotaPool, "B11", "") // 内容先空着
	err = f.MergeCell(req.QuotaPool, "B11", "E11")
	f.SetCellStyle(req.QuotaPool, "A11", "I11", infoStyle)

	f.SetCellValue(req.QuotaPool, "A12", "账单周期：")
	f.SetCellValue(req.QuotaPool, "B12", fmt.Sprintf("%v 至 %v", req.StartTime, req.EndTime))
	err = f.MergeCell(req.QuotaPool, "B12", "E12")
	f.SetCellStyle(req.QuotaPool, "A12", "I12", infoStyle)

	// 表格标题
	header := g.ArrayStr{"序号", "UPN", "服务", "产品", "计划", "来源", "消费", "记录时间", "记录ID"}
	f.SetSheetRow(req.QuotaPool, "A14", &header)

	// 表头样式
	headerStyle, err := f.NewStyle(&excelize.Style{
		Font: &excelize.Font{
			Bold:  true,
			Size:  12,
			Color: "000000",
		},
		Fill: excelize.Fill{
			Type:    "pattern",
			Color:   []string{"D3D3D3"},
			Pattern: 1,
		},
		Alignment: &excelize.Alignment{
			Horizontal: "center",
			Vertical:   "center",
		},
		Border: []excelize.Border{
			{Type: "left", Style: 2, Color: "000000"},
			{Type: "right", Style: 2, Color: "000000"},
			{Type: "top", Style: 2, Color: "000000"},
			{Type: "bottom", Style: 2, Color: "000000"},
		},
	})
	f.SetCellStyle(req.QuotaPool, "A14", "I14", headerStyle)
	var totalCost = decimal.Zero
	for idx, record := range records {
		f.SetSheetRow(req.QuotaPool, fmt.Sprintf("A%d", idx+15), &g.Array{
			fmt.Sprintf("%d", idx+1),
			record.Get("upn"),
			record.Get("svc"),
			record.Get("product"),
			record.Get("plan"),
			record.Get("source"),
			record.Get("cost"),
			record.Get("created_at"),
			record.Get("id"),
		})
		if record.Get("plan").String() == "Included" {
			f.SetCellRichText(req.QuotaPool, fmt.Sprintf("G%d", idx+15), []excelize.RichTextRun{
				{
					Text: " Included",
				},
				{
					Text: record.Get("cost").String(),
					Font: &excelize.Font{
						Strike: true,
						Color:  "BFBFBF",
					},
				},
			})
		} else {
			// 只有非 Included 的项目才计入总计
			if cost, err := decimal.NewFromString(record.Get("cost").String()); err == nil && cost.IsPositive() {
				totalCost = totalCost.Add(cost)
			} else if err != nil {
				return nil, gerror.Wrap(err, "转换 Decimal 失败")
			}
		}
		err = f.AddComment(req.QuotaPool, excelize.Comment{
			Cell:   fmt.Sprintf("G%d", idx+15),
			Author: "UniAuth.Billing",
			Paragraph: []excelize.RichTextRun{
				{
					Text: gjson.New(record.Get("remark")).MustToJsonIndentString(),
				},
			},
		})
	}
	totalRows := len(records)
	// 先给数据行应用边框样式（不包括表头）
	if totalRows > 0 {
		f.SetCellStyle(req.QuotaPool, "A15", fmt.Sprintf("I%d", 14+totalRows), borderCenterStyle)
	}
	// 重新应用表头样式，确保不被覆盖
	f.SetCellStyle(req.QuotaPool, "A14", "I14", headerStyle)

	// 添加总计行
	totalRowNum := 15 + totalRows
	f.SetCellValue(req.QuotaPool, fmt.Sprintf("F%d", totalRowNum), "总计")
	f.SetCellValue(req.QuotaPool, fmt.Sprintf("G%d", totalRowNum), totalCost.Round(2).String())

	// 创建总计行样式（加粗+背景色）
	totalStyle, err := f.NewStyle(&excelize.Style{
		Font: &excelize.Font{
			Bold: true,
			Size: 12,
		},
		Fill: excelize.Fill{
			Type:    "pattern",
			Color:   []string{"FFE4B5"},
			Pattern: 1,
		},
		Alignment: &excelize.Alignment{
			Horizontal: "center",
			Vertical:   "center",
		},
		Border: []excelize.Border{
			{Type: "left", Style: 2, Color: "000000"},
			{Type: "right", Style: 2, Color: "000000"},
			{Type: "top", Style: 2, Color: "000000"},
			{Type: "bottom", Style: 2, Color: "000000"},
		},
	})
	if err == nil {
		f.SetCellStyle(req.QuotaPool, fmt.Sprintf("A%d", totalRowNum), fmt.Sprintf("I%d", totalRowNum), totalStyle)
	}

	// 添加部门信息和联系信息到表格下方
	deptRowNum := totalRowNum + 2
	f.SetCellValue(req.QuotaPool, fmt.Sprintf("A%d", deptRowNum), "资讯科技服务处 Information Technology Services Office")
	err = f.MergeCell(req.QuotaPool, fmt.Sprintf("A%d", deptRowNum), fmt.Sprintf("I%d", deptRowNum))

	contactRowNum := deptRowNum + 1
	f.SetCellValue(req.QuotaPool, fmt.Sprintf("A%d", contactRowNum), "地址：广东省深圳市龙岗区龙翔大道2001号 | 联系电话：0755-8427-3333")
	err = f.MergeCell(req.QuotaPool, fmt.Sprintf("A%d", contactRowNum), fmt.Sprintf("I%d", contactRowNum))

	// 创建部门和联系信息样式
	contactStyle, err := f.NewStyle(&excelize.Style{
		Font: &excelize.Font{
			Size: 10,
		},
		Alignment: &excelize.Alignment{
			Horizontal: "center",
			Vertical:   "center",
		},
	})
	deptStyle, err := f.NewStyle(&excelize.Style{
		Font: &excelize.Font{
			Bold: true,
			Size: 12,
		},
		Alignment: &excelize.Alignment{
			Horizontal: "center",
			Vertical:   "center",
		},
	})
	f.SetCellStyle(req.QuotaPool, fmt.Sprintf("A%d", deptRowNum), fmt.Sprintf("I%d", deptRowNum), deptStyle)
	f.SetCellStyle(req.QuotaPool, fmt.Sprintf("A%d", contactRowNum), fmt.Sprintf("I%d", contactRowNum), contactStyle)

	// 添加页脚
	footerRowNum := contactRowNum + 2
	f.SetCellValue(req.QuotaPool, fmt.Sprintf("A%d", footerRowNum), "UniAuth Automated System, Billing Module. ©2025, CUHK-Shenzhen")
	err = f.MergeCell(req.QuotaPool, fmt.Sprintf("A%d", footerRowNum), fmt.Sprintf("I%d", footerRowNum))

	// 添加开发团队信息
	devTeamRowNum := footerRowNum + 1
	f.SetCellValue(req.QuotaPool, fmt.Sprintf("A%d", devTeamRowNum), "Developed by the Student Assistant Development Team")
	err = f.MergeCell(req.QuotaPool, fmt.Sprintf("A%d", devTeamRowNum), fmt.Sprintf("I%d", devTeamRowNum))

	// 创建页脚样式
	footerStyle, err := f.NewStyle(&excelize.Style{
		Alignment: &excelize.Alignment{
			Horizontal: "center",
			Vertical:   "center",
		},
		Font: &excelize.Font{
			Italic: true,
			Size:   9,
			Color:  "808080",
		},
		Border: []excelize.Border{
			{Type: "top", Style: 1, Color: "C0C0C0"},
		},
	})
	if err == nil {
		f.SetCellStyle(req.QuotaPool, fmt.Sprintf("A%d", footerRowNum), fmt.Sprintf("I%d", footerRowNum), footerStyle)
		f.SetCellStyle(req.QuotaPool, fmt.Sprintf("A%d", devTeamRowNum), fmt.Sprintf("I%d", devTeamRowNum), footerStyle)
	}

	// 收尾工作
	err = f.DeleteSheet("Sheet1")
	f.SetDocProps(&excelize.DocProperties{
		Creator:     "UniAuth Automated System, Billing Module",
		Description: fmt.Sprintf("GPT 服务账单 - 配额池 %v", req.QuotaPool),
	})
	f.SetHeaderFooter(req.QuotaPool, &excelize.HeaderFooterOptions{
		DifferentFirst:   false,
		DifferentOddEven: false,
		OddFooter:        "&CUniAuth Automated System, Billing Module. &\"Arial\"&8©2025, CUHK-Shenzhen",
	})
	err = f.AddIgnoredErrors(req.QuotaPool, "A:I", excelize.IgnoredErrorsNumberStoredAsText) // 忽略单元格中"以文本形式存储的数字"错误
	f.SetActiveSheet(index)

	// r := g.RequestFromCtx(ctx)
	// if r == nil {
	// 	return nil, gerror.New("failed to get request from context")
	// }
	// r.Response.ServeFileDownload("Book1.xlsx")
	if err = f.SaveAs(fmt.Sprintf("%s.xlsx", billNumber)); err != nil {
		return nil, gerror.Wrap(err, "Excel 文件保存失败")
	}
	return &v1.ExportBillRecordRes{}, nil
}
