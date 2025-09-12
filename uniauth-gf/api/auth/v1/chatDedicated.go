package v1

import (
	"github.com/gogf/gf/v2/frame/g"
)

type ChatPreCheckOneStopReq struct {
	g.Meta    `path:"/chat/oneStop" tags:"Auth/Chat" method:"post" summary:"对话服务一站式权限预检查" dc:"对话服务开启计费流程前的一站式权限检查，会进行以下检查：<br>1. 检查配额池是否存在；<br>2. 检查配额池是否被禁用；<br>3. 检查用户有没有权限使用这个配额池；<br>4. 检查配额池有没有权限使用这个 Svc 和 Product。"`
	Upn       string `json:"upn" v:"required" dc:"UPN" example:"122020255@link.cuhk.edu.cn"`
	Dom       string `json:"Dom" v:"required" dc:"Domain" example:"production"`
	Svc       string `json:"svc" v:"required" dc:"微服务" example:"Chat"`
	Product   string `json:"product" v:"required" dc:"产品" example:"qwen3-235b-a22b-instruct-2507"`
	Act       string `json:"action" v:"required" dc:"动作" example:"access"`
	QuotaPool string `json:"quotaPool" v:"required" dc:"配额池" example:"itso-deep-research-vip"`
}
type ChatPreCheckOneStopRes struct {
	Ok bool `json:"ok"`
}

type GetAvailableModelForQuotaPoolReq struct {
	g.Meta    `path:"/chat/quotaPools/models" tags:"Auth" method:"get" summary:"获取所属配额池的可用模型" dc:"动态获取指定配额池的可用模型。"`
	QuotaPool string `json:"quotaPool" v:"required" dc:"QuotaPool" example:"student_pool"`
}
type GetAvailableModelForQuotaPoolRes struct {
	g.Meta          `resEg:"resource/interface/auth/get_available_model_for_quota_pool_res.json"`
	AvailableModels []string `json:"availableModels" dc:"AvailableModel 列表"`
}
