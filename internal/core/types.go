package core


// ========== 数据结构定义 ==========

// 文档访问信息
type DocAccess struct {
	KnowledgeBaseID string `json:"knowledgeBaseId"`
	DocumentID      string `json:"documentId"`
	Permission      string `json:"permission"` // search/read/write/admin
	PermLevel       int    `json:"permLevel"`
}

// 知识库访问信息
type KBAccess struct {
	KnowledgeBaseID string   `json:"knowledgeBaseId"`
	Permission      string   `json:"permission"`
	PermLevel       int      `json:"permLevel"`
	DocumentIDs     []string `json:"documentIds"`
}

// 文档信息
type Document struct {
	KnowledgeBaseID string
	DocumentID      string
}

// ========== 权限查询结构 ==========

// 批量权限查询结构
type BatchPermissionQuery struct {
	Subject string
	ResType string
	ResID   string
	Action  string
	Effect  string
}

// 分页参数
type PaginationParams struct {
	Page     int `json:"page"`     // 页码，从1开始
	PageSize int `json:"pageSize"` // 每页大小
}

// 分页结果
type PaginatedDocAccess struct {
	Documents   []DocAccess `json:"documents"`
	TotalCount  int         `json:"totalCount"`
	Page        int         `json:"page"`
	PageSize    int         `json:"pageSize"`
	TotalPages  int         `json:"totalPages"`
	HasNext     bool        `json:"hasNext"`
	HasPrevious bool        `json:"hasPrevious"`
}

// ========== 抽象组管理 ==========







