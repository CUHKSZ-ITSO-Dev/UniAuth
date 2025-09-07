package v1

import (
	"github.com/gogf/gf/v2/frame/g"
)

// type BillRecord = 

type GetOnesBillRecordReq struct {
	g.Meta `path:"/admin/getOnesBillRecord/:upn" tags:"Billing/Admin" method:"get" summary:"查询自己的账单" dc:"查询自己的账单，根据一定的条件。"`
	Upn     string `p:"upn"`
}

type GetOnesBillRecordRes struct {
	Records string `json:"records"`
}