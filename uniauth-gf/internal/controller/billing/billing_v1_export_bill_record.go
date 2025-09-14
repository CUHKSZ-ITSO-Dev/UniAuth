package billing

import (
	"context"
	"fmt"
	"strings"
	"time"

	_ "image/png"

	authV1 "uniauth-gf/api/auth/v1"
	v1 "uniauth-gf/api/billing/v1"
	authC "uniauth-gf/internal/controller/auth"

	"github.com/gogf/gf/v2/encoding/gjson"
	"github.com/gogf/gf/v2/errors/gerror"
	"github.com/gogf/gf/v2/frame/g"
	"github.com/gogf/gf/v2/os/gfile"
	"github.com/gogf/gf/v2/os/gres"
	"github.com/shopspring/decimal"
	"github.com/xuri/excelize/v2"
)

func (c *ControllerV1) ExportBillRecord(ctx context.Context, req *v1.ExportBillRecordReq) (res *v1.ExportBillRecordRes, err error) {
	recordsPri, err := c.GetBillRecord(ctx, &v1.GetBillRecordReq{
		Upns:       req.Upns,
		QuotaPools: req.QuotaPools,
		Svc:        req.Svc,
		Product:    req.Product,
		StartTime:  req.StartTime,
		EndTime:    req.EndTime,
	})
	if err != nil {
		return nil, gerror.Wrap(err, "复用获取账单记录接口时失败")
	}
	records := recordsPri.Records
	var target []string
	if len(req.Upns) > 0 {
		target = req.Upns
	} else {
		target = req.QuotaPools
	}
	records.SetViolenceCheck(true) // 开启冲突检测，避免键名中有.的时候提取错误

	// 新建工作表
	f := excelize.NewFile()
	defer func() {
		if errClose := f.Close(); errClose != nil {
			err = gerror.Wrap(errClose, "Excel 文件关闭失败")
		}
	}()

	for _, sheet := range target {
		// 新建工作簿
		_, err := f.NewSheet(sheet)
		if err != nil {
			return nil, gerror.Wrap(err, "Excel 新建工作表失败")
		}

		_ = f.SetColWidth(sheet, "B", "H", 30)
		_ = f.SetColWidth(sheet, "A", "A", 12)
		_ = f.SetColWidth(sheet, "I", "I", 12)

		// 插入校徽
		logoFile := gres.Get("resource/public/cuhksz-logo-square.png")
		if logoFile == nil {
			return nil, gerror.New("找不到校徽图像文件")
		}
		logoData := logoFile.Content()
		trueVal := true
		if err := f.AddPictureFromBytes(sheet, "E1", &excelize.Picture{
			Extension: ".png",
			File:      logoData,
			Format: &excelize.GraphicOptions{
				ScaleX:          0.26,
				ScaleY:          0.26,
				Positioning:     "oneCell",
				OffsetX:         25,
				OffsetY:         5,
				PrintObject:     &trueVal,
				LockAspectRatio: true,
			},
		}); err != nil {
			return nil, gerror.Wrap(err, "无法加载校徽图像")
		}

		// 设置第一行高度以容纳校徽
		_ = f.SetRowHeight(sheet, 1, 120)

		// Header - 机构信息
		// 创建标题样式
		titleStyle, _ := f.NewStyle(&excelize.Style{
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
		subtitleStyle, _ := f.NewStyle(&excelize.Style{
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
		billTitleStyle, _ := f.NewStyle(&excelize.Style{
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
		_ = f.SetCellValue(sheet, "A2", "香港中文大学（深圳）")
		_ = f.MergeCell(sheet, "A2", "I2")
		_ = f.SetCellStyle(sheet, "A2", "I2", titleStyle)

		_ = f.SetCellValue(sheet, "A3", "The Chinese University of Hong Kong, Shenzhen")
		_ = f.MergeCell(sheet, "A3", "I3")
		_ = f.SetCellStyle(sheet, "A3", "I3", subtitleStyle)

		// 账单标题
		_ = f.SetCellValue(sheet, "A7", "正 式 账 单")
		_ = f.MergeCell(sheet, "A7", "I7")
		_ = f.SetCellStyle(sheet, "A7", "I7", billTitleStyle)

		// 生成账单编号和日期
		billNumber := fmt.Sprintf("BILL-%s-%s", sheet, time.Now().Format("20060102150405"))
		generateDate := time.Now().Format("2006年01月02日")

		// 账单信息区域
		infoStyle, _ := f.NewStyle(&excelize.Style{
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
		borderCenterStyle, _ := f.NewStyle(&excelize.Style{
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
		_ = f.SetCellValue(sheet, "A9", "账单编号：")
		_ = f.SetCellValue(sheet, "B9", billNumber)
		_ = f.SetCellValue(sheet, "F9", "生成日期：")
		_ = f.SetCellValue(sheet, "G9", generateDate)
		_ = f.SetCellStyle(sheet, "A9", "I9", infoStyle)

		if len(req.Upns) > 0 {
			_ = f.SetCellValue(sheet, "A10", "UPN：")
		} else {
			_ = f.SetCellValue(sheet, "A10", "配额池：")
		}
		_ = f.SetCellValue(sheet, "B10", sheet)
		_ = f.SetCellValue(sheet, "F10", "账单状态：")
		_ = f.SetCellValue(sheet, "G10", "正式账单")
		_ = f.SetCellStyle(sheet, "A10", "I10", infoStyle)

		// 添加"所有人"字段在配额池下面
		_ = f.SetCellValue(sheet, "A11", "所有人：")
		var ownerStr string
		if len(req.Upns) > 0 {
			ownerStr = sheet
		} else {
			// 调用 Auth filter policies 接口
			policies, err := authC.NewV1().FilterPolicies(ctx, &authV1.FilterPoliciesReq{
				Objs: []string{"quotaPool/" + sheet},
				Acts: []string{"owner"},
			})
			if err != nil {
				return nil, gerror.Wrap(err, "调用 Auth 模块 filter policies 接口失败")
			}
			// 提取所有策略的第一个元素并用逗号连接
			var owners []string
			for _, policy := range policies.Policies {
				if len(policy) > 0 {
					owners = append(owners, policy[0])
				}
			}
			ownerStr = strings.Join(owners, ",")
		}
		_ = f.SetCellValue(sheet, "B11", ownerStr)
		_ = f.MergeCell(sheet, "B11", "E11")
		_ = f.SetCellStyle(sheet, "A11", "I11", infoStyle)

		_ = f.SetCellValue(sheet, "A12", "账单周期：")
		_ = f.SetCellValue(sheet, "B12", fmt.Sprintf("%v 至 %v", req.StartTime, req.EndTime))
		_ = f.MergeCell(sheet, "B12", "E12")
		_ = f.SetCellStyle(sheet, "A12", "I12", infoStyle)

		// 表格标题
		header := g.ArrayStr{"序号", "UPN", "服务", "产品", "计划", "来源", "消费", "记录时间", "记录ID"}
		_ = f.SetSheetRow(sheet, "A14", &header)

		// 表头样式
		headerStyle, _ := f.NewStyle(&excelize.Style{
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
		_ = f.SetCellStyle(sheet, "A14", "I14", headerStyle)
		var totalCost = decimal.Zero
		for idx, record := range records.GetJsons(sheet) {
			_ = f.SetSheetRow(sheet, fmt.Sprintf("A%d", idx+15), &g.Array{
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
				_ = f.SetCellRichText(sheet, fmt.Sprintf("G%d", idx+15), []excelize.RichTextRun{
					{
						Text: record.Get("cost").String(),
						Font: &excelize.Font{
							Strike: true,
							Color:  "BFBFBF",
						},
					},
					{
						Text: " Included",
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
			_ = f.AddComment(sheet, excelize.Comment{
				Cell:   fmt.Sprintf("G%d", idx+15),
				Author: "UniAuth.Billing",
				Paragraph: []excelize.RichTextRun{
					{
						Text: gjson.New(record.Get("remark")).MustToJsonIndentString(),
					},
				},
			})
		}
		totalRows := len(records.GetJsons(sheet))
		// 先给数据行应用边框样式（不包括表头）
		if totalRows > 0 {
			_ = f.SetCellStyle(sheet, "A15", fmt.Sprintf("I%d", 14+totalRows), borderCenterStyle)
		}
		// 重新应用表头样式，确保不被覆盖
		_ = f.SetCellStyle(sheet, "A14", "I14", headerStyle)

		// 添加总计行
		totalRowNum := 15 + totalRows
		_ = f.SetCellValue(sheet, fmt.Sprintf("F%d", totalRowNum), "总计")
		_ = f.SetCellValue(sheet, fmt.Sprintf("G%d", totalRowNum), totalCost.Round(2).String())

		// 创建总计行样式（加粗+背景色）
		totalStyle, _ := f.NewStyle(&excelize.Style{
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
		_ = f.SetCellStyle(sheet, fmt.Sprintf("A%d", totalRowNum), fmt.Sprintf("I%d", totalRowNum), totalStyle)

		// 添加部门信息和联系信息到表格下方
		deptRowNum := totalRowNum + 2
		_ = f.SetCellValue(sheet, fmt.Sprintf("A%d", deptRowNum), "资讯科技服务处 Information Technology Services Office")
		_ = f.MergeCell(sheet, fmt.Sprintf("A%d", deptRowNum), fmt.Sprintf("I%d", deptRowNum))

		contactRowNum := deptRowNum + 1
		_ = f.SetCellValue(sheet, fmt.Sprintf("A%d", contactRowNum), "地址：广东省深圳市龙岗区龙翔大道2001号 | 联系电话：0755-8427-3333")
		_ = f.MergeCell(sheet, fmt.Sprintf("A%d", contactRowNum), fmt.Sprintf("I%d", contactRowNum))

		// 创建部门和联系信息样式
		contactStyle, _ := f.NewStyle(&excelize.Style{
			Font: &excelize.Font{
				Size: 10,
			},
			Alignment: &excelize.Alignment{
				Horizontal: "center",
				Vertical:   "center",
			},
		})
		deptStyle, _ := f.NewStyle(&excelize.Style{
			Font: &excelize.Font{
				Bold: true,
				Size: 12,
			},
			Alignment: &excelize.Alignment{
				Horizontal: "center",
				Vertical:   "center",
			},
		})
		_ = f.SetCellStyle(sheet, fmt.Sprintf("A%d", deptRowNum), fmt.Sprintf("I%d", deptRowNum), deptStyle)
		_ = f.SetCellStyle(sheet, fmt.Sprintf("A%d", contactRowNum), fmt.Sprintf("I%d", contactRowNum), contactStyle)

		// 添加页脚
		footerRowNum := contactRowNum + 2
		_ = f.SetCellValue(sheet, fmt.Sprintf("A%d", footerRowNum), "UniAuth Automated System, Billing Module. ©2025, CUHK-Shenzhen")
		_ = f.MergeCell(sheet, fmt.Sprintf("A%d", footerRowNum), fmt.Sprintf("I%d", footerRowNum))

		// 添加开发团队信息
		devTeamRowNum := footerRowNum + 1
		_ = f.SetCellValue(sheet, fmt.Sprintf("A%d", devTeamRowNum), "Developed by the Student Assistant Development Team")
		_ = f.MergeCell(sheet, fmt.Sprintf("A%d", devTeamRowNum), fmt.Sprintf("I%d", devTeamRowNum))

		// 创建页脚样式
		footerStyle, _ := f.NewStyle(&excelize.Style{
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
		_ = f.SetCellStyle(sheet, fmt.Sprintf("A%d", footerRowNum), fmt.Sprintf("I%d", footerRowNum), footerStyle)
		_ = f.SetCellStyle(sheet, fmt.Sprintf("A%d", devTeamRowNum), fmt.Sprintf("I%d", devTeamRowNum), footerStyle)

		_ = f.SetHeaderFooter(sheet, &excelize.HeaderFooterOptions{
			DifferentFirst:   false,
			DifferentOddEven: false,
			OddFooter:        "&CUniAuth Automated System, Billing Module. &\"Arial\"&8©2025, CUHK-Shenzhen",
		})
		_ = f.AddIgnoredErrors(sheet, "A:I", excelize.IgnoredErrorsNumberStoredAsText) // 忽略单元格中"以文本形式存储的数字"错误
	}

	// f.SetActiveSheet(index)

	// 收尾工作
	_ = f.DeleteSheet("Sheet1")
	var filename string
	if len(req.Upns) > 0 {
		_ = f.SetDocProps(&excelize.DocProperties{
			Creator:     "UniAuth Automated System, Billing Module",
			Description: fmt.Sprintf("GPT 服务账单 - UPNs %v", req.Upns),
		})
		filename = fmt.Sprintf("Bill-Batch[UPNS]%s.xlsx", time.Now().Format("20060102150405"))
	} else {
		_ = f.SetDocProps(&excelize.DocProperties{
			Creator:     "UniAuth Automated System, Billing Module",
			Description: fmt.Sprintf("GPT 服务账单 - 配额池 %v", req.QuotaPools),
		})
		filename = fmt.Sprintf("Bill-Batch[Quota Pools]%s.xlsx", time.Now().Format("20060102150405"))
	}

	if err = f.SaveAs(filename); err != nil {
		return nil, gerror.Wrap(err, "Excel 文件保存失败")
	}

	r := g.RequestFromCtx(ctx)
	if r == nil {
		return nil, gerror.New("无法从上下文中获取请求对象")
	}
	r.Response.ServeFileDownload(filename)

	if err := gfile.Remove(filename); err != nil {
		return nil, gerror.Wrap(err, "Excel 文件删除失败")
	}

	return &v1.ExportBillRecordRes{}, nil
}
