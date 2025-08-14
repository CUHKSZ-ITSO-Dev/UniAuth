package services

import (
	"fmt"
	"strconv"
	"strings"

	"uniauth/internal/core"

	"github.com/gin-gonic/gin"
)

// DocumentService 文档服务
type DocumentService struct {
	Service *AuthService
}

// NewDocumentService 创建文档服务
func NewDocumentService(service *AuthService) *DocumentService {
	return &DocumentService{Service: service}
}

// ========== 核心功能实现 ==========

// 获取用户可访问的所有文档
func (d *DocumentService) GetUserAccessibleDocs(c *gin.Context) {
	upn := c.Param("upn")

	// 分页参数
	var pagination core.PaginationParams
	pagination.Page = 1
	pagination.PageSize = 1000
	if page := c.Query("page"); page != "" {
		if p, err := strconv.Atoi(page); err == nil && p > 0 {
			pagination.Page = p
		}
	}
	if pageSize := c.Query("pageSize"); pageSize != "" {
		if ps, err := strconv.Atoi(pageSize); err == nil && ps > 0 && ps <= 5000 {
			pagination.PageSize = ps
		}
	}

	// 使用原生SQL一次性获取所有相关权限
	permissions, err := d.getUserAllPermissionsBatch(upn)
	if err != nil {
		c.JSON(500, gin.H{"error": "Failed to fetch permissions"})
		return
	}

	// 并发处理权限解析和文档匹配
	result, err := d.processPermissionsAndDocsConcurrently(permissions, pagination)
	if err != nil {
		c.JSON(500, gin.H{"error": "Failed to process permissions"})
		return
	}

	c.JSON(200, gin.H{
		"upn":            upn,
		"documents":      result.Documents,
		"totalDocuments": result.TotalCount,
		"page":           result.Page,
		"pageSize":       result.PageSize,
		"totalPages":     result.TotalPages,
		"hasNext":        result.HasNext,
		"hasPrevious":    result.HasPrevious,
	})
}

// 批量获取用户所有权限（直接权限+角色权限）
func (d *DocumentService) getUserAllPermissionsBatch(upn string) ([]core.BatchPermissionQuery, error) {
	var permissions []core.BatchPermissionQuery

	// 使用原生SQL一次性获取所有相关权限
	query := `
		SELECT DISTINCT p.v0 as subject, p.v1 as res_type, p.v2 as res_id, p.v3 as action,
		       COALESCE(p.v4, 'allow') as effect
		FROM casbin_rule p
		WHERE p.ptype = 'p'
		  AND (p.v0 = ?
		       OR p.v0 IN (
		           SELECT g.v1
		           FROM casbin_rule g
		           WHERE g.ptype = 'g' AND g.v0 = ?
		       ))
		  AND p.v1 IN ('kb', 'doc')
		ORDER BY p.v1, p.v2, p.v3
	`

	rows, err := d.Service.DB.Raw(query, upn, upn).Rows()
	if err != nil {
		return nil, fmt.Errorf("query permissions: %w", err)
	}
	defer rows.Close()

	for rows.Next() {
		var perm core.BatchPermissionQuery
		if err := rows.Scan(&perm.Subject, &perm.ResType, &perm.ResID, &perm.Action, &perm.Effect); err != nil {
			return nil, fmt.Errorf("scan permission: %w", err)
		}
		permissions = append(permissions, perm)
	}

	return permissions, nil
}

// 并发处理权限和文档匹配
func (d *DocumentService) processPermissionsAndDocsConcurrently(permissions []core.BatchPermissionQuery, pagination core.PaginationParams) (*core.PaginatedDocAccess, error) {
	const numWorkers = 4

	// 创建channel用于并发处理
	permChan := make(chan []core.BatchPermissionQuery, numWorkers)
	resultChan := make(chan map[string]*core.DocAccess, numWorkers)
	errorChan := make(chan error, numWorkers)

	// 将权限分批处理
	batchSize := len(permissions) / numWorkers
	if batchSize == 0 {
		batchSize = len(permissions)
	}

	// 启动worker goroutines
	for range numWorkers {
		go d.processPermissionBatch(permChan, resultChan, errorChan)
	}

	// 分发权限批次
	go func() {
		defer close(permChan)
		for i := 0; i < len(permissions); i += batchSize {
			end := i + batchSize
			if end > len(permissions) {
				end = len(permissions)
			}
			permChan <- permissions[i:end]
		}
	}()

	// 收集结果
	docAccessMap := make(map[string]*core.DocAccess)
	kbAccessMap := make(map[string]*core.KBAccess)

	for i := 0; i < numWorkers; i++ {
		select {
		case result := <-resultChan:
			for key, access := range result {
				if existing, ok := docAccessMap[key]; ok {
					// 保留权限级别更高的
					if access.PermLevel > existing.PermLevel {
						docAccessMap[key] = access
					}
				} else {
					docAccessMap[key] = access
				}
			}
		case err := <-errorChan:
			return nil, err
		}
	}

	// 获取文档列表（分页）
	existingDocs, totalCount, err := d.getExistingDocumentsPaginated(pagination)
	if err != nil {
		return nil, fmt.Errorf("get documents: %w", err)
	}

	// 构建最终结果
	finalDocAccess := []core.DocAccess{}
	for _, doc := range existingDocs {
		docKey := doc.KnowledgeBaseID + "/" + doc.DocumentID

		if access, ok := docAccessMap[docKey]; ok {
			finalDocAccess = append(finalDocAccess, *access)
		} else if kbAccess, ok := kbAccessMap[doc.KnowledgeBaseID]; ok {
			finalDocAccess = append(finalDocAccess, core.DocAccess{
				KnowledgeBaseID: doc.KnowledgeBaseID,
				DocumentID:      doc.DocumentID,
				Permission:      kbAccess.Permission,
				PermLevel:       kbAccess.PermLevel,
			})
		}
	}

	totalPages := (totalCount + pagination.PageSize - 1) / pagination.PageSize

	return &core.PaginatedDocAccess{
		Documents:   finalDocAccess,
		TotalCount:  totalCount,
		Page:        pagination.Page,
		PageSize:    pagination.PageSize,
		TotalPages:  totalPages,
		HasNext:     pagination.Page < totalPages,
		HasPrevious: pagination.Page > 1,
	}, nil
}

// 处理权限批次的worker函数
func (d *DocumentService) processPermissionBatch(permChan <-chan []core.BatchPermissionQuery, resultChan chan<- map[string]*core.DocAccess, errorChan chan<- error) {
	docAccessMap := make(map[string]*core.DocAccess)
	kbAccessMap := make(map[string]*core.KBAccess)

	for permissions := range permChan {
		for _, perm := range permissions {
			permLevel := PermLevelMap[perm.Action]

			if perm.ResType == "kb" {
				if perm.Effect == "deny" {
					delete(kbAccessMap, perm.ResID)
					// 移除相关文档权限
					for docKey := range docAccessMap {
						if strings.HasPrefix(docKey, perm.ResID+"/") {
							delete(docAccessMap, docKey)
						}
					}
				} else {
					if existing, ok := kbAccessMap[perm.ResID]; ok {
						if permLevel > existing.PermLevel {
							existing.Permission = perm.Action
							existing.PermLevel = permLevel
						}
					} else {
						kbAccessMap[perm.ResID] = &core.KBAccess{
							KnowledgeBaseID: perm.ResID,
							Permission:      perm.Action,
							PermLevel:       permLevel,
						}
					}
				}
			}

			if perm.ResType == "doc" {
				if perm.Effect == "deny" {
					// 只处理具体文档的deny规则，不支持通配符
					delete(docAccessMap, perm.ResID)
				} else {
					// 只处理具体文档权限，不支持通配符
					parts := strings.SplitN(perm.ResID, "/", 2)
					if len(parts) == 2 {
						docKey := perm.ResID
						if existing, ok := docAccessMap[docKey]; ok {
							if permLevel > existing.PermLevel {
								existing.Permission = perm.Action
								existing.PermLevel = permLevel
							}
						} else {
							docAccessMap[docKey] = &core.DocAccess{
								KnowledgeBaseID: parts[0],
								DocumentID:      parts[1],
								Permission:      perm.Action,
								PermLevel:       permLevel,
							}
						}
					}
				}
			}
		}
	}

	resultChan <- docAccessMap
}

// 分页获取文档列表
func (d *DocumentService) getExistingDocumentsPaginated(pagination core.PaginationParams) ([]core.Document, int, error) {
	// TODO: 实现真实的分页查询
	// 这里模拟从文档服务或数据库获取分页数据

	// 模拟总文档数
	totalDocs := 50000

	// 计算偏移量
	offset := (pagination.Page - 1) * pagination.PageSize

	// 模拟生成分页文档
	docs := make([]core.Document, 0, pagination.PageSize)
	for i := 0; i < pagination.PageSize && offset+i < totalDocs; i++ {
		docIndex := offset + i
		kbIndex := docIndex / 1000 // 每1000个文档一个知识库
		docs = append(docs, core.Document{
			KnowledgeBaseID: fmt.Sprintf("kb-%03d", kbIndex),
			DocumentID:      fmt.Sprintf("doc-%06d", docIndex),
		})
	}

	return docs, totalDocs, nil
}
