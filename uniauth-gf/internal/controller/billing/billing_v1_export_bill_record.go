package billing

import (
	"context"
	"fmt"
	"strconv"
	"time"

	v1 "uniauth-gf/api/billing/v1"

	"github.com/gogf/gf/v2/errors/gerror"
	"github.com/signintech/gopdf"
)

// truncateString 截断字符串
func truncateString(s string, maxLen int) string {
	if len(s) <= maxLen {
		return s
	}
	return s[:maxLen-3] + "..."
}

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

	// 创建PDF对象
	pdf := gopdf.GoPdf{}
	pdf.Start(gopdf.Config{
		PageSize: *gopdf.PageSizeA4,
	})
	pdf.AddPage()

	// 添加字体
	err = pdf.AddTTFFont("SourceHanSans", "resource/font/SourceHanSansSC-VF.ttf")
	if err != nil {
		return nil, gerror.Wrap(err, "添加字体时失败")
	}

	// 页面边距
	leftMargin := 40.0
	rightMargin := 555.0
	topMargin := 60.0

	// 绘制页眉
	pdf.SetLineWidth(2)
	pdf.SetStrokeColor(0, 102, 204) // 蓝色
	pdf.Line(leftMargin, topMargin-10, rightMargin, topMargin-10)

	// 公司Logo位置（预留）
	pdf.SetFillColor(240, 240, 240)
	pdf.RectFromUpperLeftWithStyle(leftMargin, topMargin, 80, 60, "F")
	pdf.SetX(leftMargin + 5)
	pdf.SetY(topMargin + 25)
	err = pdf.SetFont("SourceHanSans", "", 10)
	if err != nil {
		return nil, gerror.Wrap(err, "设置字体失败")
	}
	pdf.SetTextColor(100, 100, 100)
	pdf.Cell(nil, "LOGO")

	// 我方公司信息
	pdf.SetX(leftMargin)
	pdf.SetY(topMargin + 70)
	err = pdf.SetFont("SourceHanSans", "", 12)
	if err != nil {
		return nil, gerror.Wrap(err, "设置字体失败")
	}
	pdf.SetTextColor(0, 0, 0)
	pdf.Cell(nil, "深度研究科技有限公司")
	pdf.Br(15)

	pdf.SetX(leftMargin)
	err = pdf.SetFont("SourceHanSans", "", 10)
	if err != nil {
		return nil, gerror.Wrap(err, "设置字体失败")
	}
	pdf.SetTextColor(80, 80, 80)
	pdf.Cell(nil, "地址: 北京市海淀区中关村大街1号")
	pdf.Br(12)
	pdf.SetX(leftMargin)
	pdf.Cell(nil, "电话: 010-12345678")
	pdf.Br(12)
	pdf.SetX(leftMargin)
	pdf.Cell(nil, "邮箱: billing@deepresearch.com")
	pdf.Br(12)
	pdf.SetX(leftMargin)
	pdf.Cell(nil, "税号: 91110108MA01234567")

	// 账单标题
	pdf.SetX(300)
	pdf.SetY(topMargin + 20)
	err = pdf.SetFont("SourceHanSans", "", 24)
	if err != nil {
		return nil, gerror.Wrap(err, "设置字体失败")
	}
	pdf.SetTextColor(0, 102, 204)
	pdf.Cell(nil, "服务账单")

	// 账单信息框
	billInfoY := topMargin + 70
	pdf.SetFillColor(245, 248, 252)
	pdf.RectFromUpperLeftWithStyle(300, billInfoY, 255, 90, "F")
	pdf.SetStrokeColor(200, 200, 200)
	pdf.RectFromUpperLeftWithStyle(300, billInfoY, 255, 90, "S")

	// 账单编号和日期
	pdf.SetX(310)
	pdf.SetY(billInfoY + 10)
	err = pdf.SetFont("SourceHanSans", "", 11)
	if err != nil {
		return nil, gerror.Wrap(err, "设置字体失败")
	}
	pdf.SetTextColor(60, 60, 60)
	billNumber := fmt.Sprintf("BILL-%s-%d", req.QuotaPool, time.Now().Unix())
	pdf.Cell(nil, fmt.Sprintf("账单编号: %s", billNumber))
	pdf.Br(15)

	pdf.SetX(310)
	pdf.Cell(nil, fmt.Sprintf("账单日期: %s", time.Now().Format("2006-01-02")))
	pdf.Br(15)

	pdf.SetX(310)
	pdf.Cell(nil, fmt.Sprintf("服务期间: %s 至 %s", req.StartTime, req.EndTime))
	pdf.Br(15)

	pdf.SetX(310)
	pdf.Cell(nil, fmt.Sprintf("配额池: %s", req.QuotaPool))

	// 客户信息
	customerY := billInfoY + 110
	pdf.SetX(leftMargin)
	pdf.SetY(customerY)
	err = pdf.SetFont("SourceHanSans", "", 12)
	if err != nil {
		return nil, gerror.Wrap(err, "设置字体失败")
	}
	pdf.SetTextColor(0, 0, 0)
	pdf.Cell(nil, "账单接收方:")
	pdf.Br(18)

	pdf.SetFillColor(250, 250, 250)
	pdf.RectFromUpperLeftWithStyle(leftMargin, customerY+20, 250, 70, "F")
	pdf.SetStrokeColor(220, 220, 220)
	pdf.RectFromUpperLeftWithStyle(leftMargin, customerY+20, 250, 70, "S")

	pdf.SetX(leftMargin + 10)
	pdf.SetY(customerY + 30)
	err = pdf.SetFont("SourceHanSans", "", 11)
	if err != nil {
		return nil, gerror.Wrap(err, "设置字体失败")
	}
	pdf.SetTextColor(40, 40, 40)
	pdf.Cell(nil, "智能科技有限公司")
	pdf.Br(15)

	pdf.SetX(leftMargin + 10)
	pdf.Cell(nil, "地址: 上海市浦东新区张江高科技园区")
	pdf.Br(15)

	pdf.SetX(leftMargin + 10)
	pdf.Cell(nil, "联系人: 张经理")
	pdf.Br(15)

	pdf.SetX(leftMargin + 10)
	pdf.Cell(nil, "电话: 021-87654321")

	// 服务明细表格
	tableY := customerY + 110
	pdf.SetY(tableY)

	// 表格标题
	pdf.SetX(leftMargin)
	err = pdf.SetFont("SourceHanSans", "", 14)
	if err != nil {
		return nil, gerror.Wrap(err, "设置字体失败")
	}
	pdf.SetTextColor(0, 0, 0)
	pdf.Cell(nil, "服务明细")
	pdf.Br(25)

	// 表格参数
	tableStartX := leftMargin
	tableWidth := rightMargin - leftMargin
	columnWidths := []float64{30, 75, 65, 65, 60, 60, 70, 90}
	headers := []string{"序号", "用户标识", "服务类型", "产品名称", "计费方案", "来源", "费用", "使用时间"}

	// 绘制表头函数
	drawTableHeader := func() {
		currentY := pdf.GetY()

		// 表头背景
		pdf.SetFillColor(0, 102, 204)
		pdf.RectFromUpperLeftWithStyle(tableStartX, currentY, tableWidth, 25, "F")

		// 表头文字
		err = pdf.SetFont("SourceHanSans", "", 8)
		if err != nil {
			return
		}
		pdf.SetTextColor(255, 255, 255)

		currentX := tableStartX
		for i, header := range headers {
			// 计算文字居中位置
			textWidth, _ := pdf.MeasureTextWidth(header)
			centerX := currentX + (columnWidths[i]-textWidth)/2
			pdf.SetX(centerX)
			pdf.SetY(currentY + 8)
			pdf.Cell(nil, header)
			currentX += columnWidths[i]
		}
		pdf.SetY(currentY + 25)
	}

	// 绘制表头
	drawTableHeader()

	// 设置表格内容字体
	err = pdf.SetFont("SourceHanSans", "", 7)
	if err != nil {
		return nil, gerror.Wrap(err, "设置表格内容字体大小时失败")
	}
	pdf.SetTextColor(40, 40, 40)

	// 添加记录数据
	var totalCost float64 = 0
	rowHeight := 20.0

	for i, record := range recordsPri.Records {
		currentY := pdf.GetY()

		// 绘制行背景（交替颜色）
		if i%2 == 0 {
			pdf.SetFillColor(248, 249, 250)
		} else {
			pdf.SetFillColor(255, 255, 255)
		}
		pdf.RectFromUpperLeftWithStyle(tableStartX, currentY, tableWidth, rowHeight, "F")

		// 绘制行边框
		pdf.SetLineWidth(0.5)
		pdf.SetStrokeColor(220, 220, 220)
		pdf.RectFromUpperLeftWithStyle(tableStartX, currentY, tableWidth, rowHeight, "S")

		currentX := tableStartX

		// 准备所有字段数据
		fields := []string{
			strconv.Itoa(i + 1),                                   // 序号
			truncateString(record.Get("upn").String(), 12),        // UPN截断
			truncateString(record.Get("svc").String(), 8),         // 服务
			truncateString(record.Get("product").String(), 8),     // 产品
			truncateString(record.Get("plan").String(), 8),        // 计费方案
			truncateString(record.Get("source").String(), 8),      // 来源
			fmt.Sprintf("¥%.2f", record.Get("cost").Float64()),    // 费用
			truncateString(record.Get("created_at").String(), 16), // 创建时间
		}

		// 累计费用
		cost := record.Get("cost").Float64()
		totalCost += cost

		// 绘制每个字段，居中对齐
		for j, field := range fields {
			textWidth, _ := pdf.MeasureTextWidth(field)
			centerX := currentX + (columnWidths[j]-textWidth)/2
			pdf.SetX(centerX)
			pdf.SetY(currentY + 6)
			pdf.Cell(nil, field)
			currentX += columnWidths[j]
		}

		pdf.SetY(currentY + rowHeight)

		// 检查是否需要换页
		if pdf.GetY() > 720 {
			pdf.AddPage()
			drawTableHeader()
		}
	}

	// 表格底部边框
	pdf.SetLineWidth(1)
	pdf.SetStrokeColor(0, 102, 204)
	pdf.Line(tableStartX, pdf.GetY(), tableStartX+tableWidth, pdf.GetY())

	// 合计区域
	summaryY := pdf.GetY() + 20
	pdf.SetY(summaryY)

	// 合计框
	summaryBoxX := rightMargin - 200
	pdf.SetFillColor(245, 248, 252)
	pdf.RectFromUpperLeftWithStyle(summaryBoxX, summaryY, 200, 60, "F")
	pdf.SetStrokeColor(0, 102, 204)
	pdf.SetLineWidth(1)
	pdf.RectFromUpperLeftWithStyle(summaryBoxX, summaryY, 200, 60, "S")

	// 小计
	pdf.SetX(summaryBoxX + 10)
	pdf.SetY(summaryY + 10)
	err = pdf.SetFont("SourceHanSans", "", 11)
	if err != nil {
		return nil, gerror.Wrap(err, "设置字体失败")
	}
	pdf.SetTextColor(60, 60, 60)
	pdf.Cell(nil, "小计:")
	pdf.SetX(summaryBoxX + 120)
	pdf.Cell(nil, fmt.Sprintf("¥%.4f", totalCost))

	// 税费（示例）
	tax := totalCost * 0.06 // 6%税率
	pdf.SetX(summaryBoxX + 10)
	pdf.SetY(summaryY + 25)
	pdf.Cell(nil, "税费 (6%):")
	pdf.SetX(summaryBoxX + 120)
	pdf.Cell(nil, fmt.Sprintf("¥%.4f", tax))

	// 总计
	total := totalCost + tax
	pdf.SetX(summaryBoxX + 10)
	pdf.SetY(summaryY + 40)
	err = pdf.SetFont("SourceHanSans", "", 12)
	if err != nil {
		return nil, gerror.Wrap(err, "设置字体失败")
	}
	pdf.SetTextColor(0, 102, 204)
	pdf.Cell(nil, "总计:")
	pdf.SetX(summaryBoxX + 120)
	pdf.Cell(nil, fmt.Sprintf("¥%.4f", total))

	// 页脚信息
	footerY := summaryY + 80
	pdf.SetY(footerY)

	// 付款信息
	pdf.SetX(leftMargin)
	err = pdf.SetFont("SourceHanSans", "", 10)
	if err != nil {
		return nil, gerror.Wrap(err, "设置字体失败")
	}
	pdf.SetTextColor(80, 80, 80)
	pdf.Cell(nil, "付款方式: 银行转账")
	pdf.Br(15)

	pdf.SetX(leftMargin)
	pdf.Cell(nil, "账户名称: 深度研究科技有限公司")
	pdf.Br(15)

	pdf.SetX(leftMargin)
	pdf.Cell(nil, "开户银行: 中国银行北京中关村支行")
	pdf.Br(15)

	pdf.SetX(leftMargin)
	pdf.Cell(nil, "银行账号: 1234 5678 9012 3456 789")
	pdf.Br(15)

	pdf.SetX(leftMargin)
	pdf.Cell(nil, "付款期限: 收到账单后30天内")

	// 页面底部线条
	pdf.SetY(footerY + 90)
	pdf.SetLineWidth(1)
	pdf.SetStrokeColor(0, 102, 204)
	pdf.Line(leftMargin, pdf.GetY(), rightMargin, pdf.GetY())

	// 联系信息
	pdf.SetX(leftMargin)
	pdf.SetY(pdf.GetY() + 10)
	err = pdf.SetFont("SourceHanSans", "", 9)
	if err != nil {
		return nil, gerror.Wrap(err, "设置字体失败")
	}
	pdf.SetTextColor(120, 120, 120)
	pdf.Cell(nil, "如有疑问，请联系我们: billing@deepresearch.com | 010-12345678")

	// 生成文件名
	fileName := fmt.Sprintf("invoice_%s_%s.pdf", req.QuotaPool, time.Now().Format("20060102150405"))

	// 保存PDF
	pdf.WritePdf(fileName)
	return
	// 返回PDF文件内容
	// fileContent := pdf.GetBytesPdf()

	// return &v1.ExportBillRecordRes{
	// 	File: fileContent,
	// }, nil
}
