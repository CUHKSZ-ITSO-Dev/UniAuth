package billing

import (
	"context"
	"fmt"

	v1 "uniauth-gf/api/billing/v1"

	"github.com/gogf/gf/frame/g"
	"github.com/gogf/gf/v2/encoding/gjson"
	"github.com/gogf/gf/v2/errors/gerror"
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

	f.SetColWidth(req.QuotaPool, "C", "I", 30)
	f.SetColWidth(req.QuotaPool, "B", "B", 12)
	f.SetColWidth(req.QuotaPool, "J", "J", 12)

	// Header
	f.SetCellValue(req.QuotaPool, "B2", "香港中文大学（深圳）")
	err = f.MergeCell(req.QuotaPool, "B2", "J2")
	f.SetCellValue(req.QuotaPool, "B3", "资讯科技服务处")
	err = f.MergeCell(req.QuotaPool, "B3", "J3")
	f.SetCellValue(req.QuotaPool, "B4", "GPT 服务账单")
	err = f.MergeCell(req.QuotaPool, "B4", "J4")
	borderCenterStyle, err := f.NewStyle(&excelize.Style{
		Alignment: &excelize.Alignment{
			Horizontal: "center",
			Vertical:   "center",
		},
		Border: []excelize.Border{
			{
				Type:  "left",
				Style: 1,
				Color: "000000",
			},
			{
				Type:  "right",
				Style: 1,
				Color: "000000",
			},
			{
				Type:  "top",
				Style: 1,
				Color: "000000",
			},
			{
				Type:  "bottom",
				Style: 1,
				Color: "000000",
			},
		},
	})
	f.SetCellStyle(req.QuotaPool, "B2", "J4", borderCenterStyle)

	// Details
	f.SetCellValue(req.QuotaPool, "B6", "配额池")
	f.SetCellValue(req.QuotaPool, "C6", req.QuotaPool)
	f.SetCellValue(req.QuotaPool, "B7", "查询周期")
	err = f.MergeCell(req.QuotaPool, "C7", "E7")
	f.SetCellValue(req.QuotaPool, "C7", fmt.Sprintf("%v - %v", req.StartTime, req.EndTime))

	// Tables
	header := g.ArrayStr{"序号", "UPN", "服务", "产品", "计划", "来源", "消费", "记录时间", "记录ID"}
	f.SetSheetRow(req.QuotaPool, "B10", &header)
	for idx, record := range records {
		f.SetSheetRow(req.QuotaPool, fmt.Sprintf("B%d", idx+11), &g.Array{
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
			f.SetCellRichText(req.QuotaPool, fmt.Sprintf("H%d", idx+11), []excelize.RichTextRun{
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
		}
		err = f.AddComment(req.QuotaPool, excelize.Comment{
			Cell:   fmt.Sprintf("H%d", idx+11),
			Author: "UniAuth.Billing",
			Paragraph: []excelize.RichTextRun{
				{
					Text: gjson.New(record.Get("remark")).MustToJsonIndentString(),
				},
			},
		})
	}
	totalRows := len(records)
	f.SetCellStyle(req.QuotaPool, "B10", fmt.Sprintf("J%d", 10+totalRows), borderCenterStyle)

	f.SetActiveSheet(index)
	if err = f.SaveAs("Book1.xlsx"); err != nil {
		return nil, gerror.Wrap(err, "Excel 文件保存失败")
	}


	r := g.RequestFromCtx(ctx)
	if r == nil {
		fmt.Println("NNNNILLLL!")
	}
	r.Response.ServeFileDownload("Book1.xlsx", "123.xlsx")
	return &v1.ExportBillRecordRes{}, nil
}
