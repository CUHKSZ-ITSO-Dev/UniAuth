package handler

import (
	"encoding/csv"
	"fmt"
	"io"
	"os"
	"strconv"
	"strings"
	"time"

	"uniauth/internal/modules/rbac/service"

	"github.com/gin-gonic/gin"
)

// RuleManagementHandler 规则管理处理器
type RuleManagementHandler struct {
	Service      *service.AuthService
	AuditHandler *AuditHandler
}

// NewRuleManagementHandler 创建规则管理处理器
func NewRuleManagementHandler(service *service.AuthService, auditHandler *AuditHandler) *RuleManagementHandler {
	return &RuleManagementHandler{
		Service:      service,
		AuditHandler: auditHandler,
	}
}

// Rule 规则结构
type Rule struct {
	ID        string `json:"id"`
	Type      string `json:"type"`     // "policy" or "role"
	Subject   string `json:"subject"`  // 用户或组
	Domain    string `json:"domain"`   // 资源域
	Object    string `json:"object"`   // 资源对象
	Action    string `json:"action"`   // 动作
	Effect    string `json:"effect"`   // allow/deny
	Role      string `json:"role"`     // 角色（仅用于role类型）
	IsActive  bool   `json:"isActive"` // 是否启用
	CreatedAt string `json:"createdAt"`
	UpdatedAt string `json:"updatedAt"`
	Source    string `json:"source"` // "database" or "csv"
}

// RuleRequest 规则请求结构
type RuleRequest struct {
	Type    string `json:"type"`
	Subject string `json:"subject"`
	Domain  string `json:"domain"`
	Object  string `json:"object"`
	Action  string `json:"action"`
	Effect  string `json:"effect"`
	Role    string `json:"role"`
}

// AuditLog 审计日志结构
type AuditLog struct {
	ID        string      `json:"id"`
	Timestamp time.Time   `json:"timestamp"`
	User      string      `json:"user"`
	Action    string      `json:"action"`
	Resource  string      `json:"resource"`
	Details   interface{} `json:"details"`
	Success   bool        `json:"success"`
}

// 获取所有规则
func (h *RuleManagementHandler) GetAllRules(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("pageSize", "50"))
	search := c.Query("search")
	ruleType := c.Query("type") // "policy", "role", or ""

	var allRules []Rule

	// 获取策略规则
	if ruleType == "" || ruleType == "policy" {
		policies, _ := h.Service.Enforcer.GetPolicy()
		for i, policy := range policies {
			if len(policy) >= 4 {
				rule := Rule{
					ID:        fmt.Sprintf("p_%d", i),
					Type:      "policy",
					Subject:   policy[0],
					Domain:    policy[1],
					Object:    policy[2],
					Action:    policy[3],
					Effect:    "allow", // 默认
					IsActive:  true,
					CreatedAt: time.Now().Format("2006-01-02 15:04:05"),
					UpdatedAt: time.Now().Format("2006-01-02 15:04:05"),
					Source:    "database",
				}
				if len(policy) > 4 {
					rule.Effect = policy[4]
				}

				// 搜索过滤
				if search == "" || h.matchesSearch(rule, search) {
					allRules = append(allRules, rule)
				}
			}
		}
	}

	// 获取角色继承规则
	if ruleType == "" || ruleType == "role" {
		groupingPolicies, _ := h.Service.Enforcer.GetGroupingPolicy()
		for i, grouping := range groupingPolicies {
			if len(grouping) >= 2 {
				rule := Rule{
					ID:        fmt.Sprintf("g_%d", i),
					Type:      "role",
					Subject:   grouping[0],
					Role:      grouping[1],
					IsActive:  true,
					CreatedAt: time.Now().Format("2006-01-02 15:04:05"),
					UpdatedAt: time.Now().Format("2006-01-02 15:04:05"),
					Source:    "database",
				}

				// 搜索过滤
				if search == "" || h.matchesSearch(rule, search) {
					allRules = append(allRules, rule)
				}
			}
		}
	}

	// 分页
	total := len(allRules)
	start := (page - 1) * pageSize
	end := start + pageSize
	if start >= total {
		allRules = []Rule{}
	} else {
		if end > total {
			end = total
		}
		allRules = allRules[start:end]
	}

	response := gin.H{
		"rules":      allRules,
		"total":      total,
		"page":       page,
		"pageSize":   pageSize,
		"totalPages": (total + pageSize - 1) / pageSize,
	}

	c.JSON(200, response)
}

// GetRulesForSubject 获取特定主体的所有规则
func (h *RuleManagementHandler) GetRulesForSubject(c *gin.Context) {
	subject := c.Param("subject")

	var subjectRules []Rule

	// 获取策略规则
	policies, _ := h.Service.Enforcer.GetFilteredPolicy(0, subject)
	for i, policy := range policies {
		if len(policy) >= 4 {
			rule := Rule{
				ID:        fmt.Sprintf("p_%s_%d", subject, i), // 创建一个唯一的临时ID
				Type:      "policy",
				Subject:   policy[0],
				Domain:    policy[1],
				Object:    policy[2],
				Action:    policy[3],
				Effect:    "allow", // 默认
				IsActive:  true,
				CreatedAt: time.Now().Format("2006-01-02 15:04:05"),
				UpdatedAt: time.Now().Format("2006-01-02 15:04:05"),
				Source:    "database",
			}
			if len(policy) > 4 {
				rule.Effect = policy[4]
			}
			subjectRules = append(subjectRules, rule)
		}
	}

	c.JSON(200, gin.H{
		"rules": subjectRules,
		"total": len(subjectRules),
	})
}

// 搜索匹配
func (h *RuleManagementHandler) matchesSearch(rule Rule, search string) bool {
	search = strings.ToLower(search)
	return strings.Contains(strings.ToLower(rule.Subject), search) ||
		strings.Contains(strings.ToLower(rule.Domain), search) ||
		strings.Contains(strings.ToLower(rule.Object), search) ||
		strings.Contains(strings.ToLower(rule.Action), search) ||
		strings.Contains(strings.ToLower(rule.Role), search)
}

// 添加规则
func (h *RuleManagementHandler) AddRule(c *gin.Context) {
	var req RuleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": "Invalid request format"})
		return
	}

	var success bool
	var message string
	var auditDetails interface{}

	switch req.Type {
	case "policy":
		if req.Effect == "" {
			req.Effect = "allow"
		}
		success, _ = h.Service.Enforcer.AddPolicy(req.Subject, req.Domain, req.Object, req.Action, req.Effect)
		message = fmt.Sprintf("Policy rule added: %s -> %s %s %s (%s)", req.Subject, req.Domain, req.Object, req.Action, req.Effect)
		auditDetails = gin.H{
			"type":    "policy",
			"subject": req.Subject,
			"domain":  req.Domain,
			"object":  req.Object,
			"action":  req.Action,
			"effect":  req.Effect,
		}

	case "role":
		success, _ = h.Service.Enforcer.AddRoleForUser(req.Subject, req.Role)
		message = fmt.Sprintf("Role assignment added: %s -> %s", req.Subject, req.Role)
		auditDetails = gin.H{
			"type":    "role",
			"subject": req.Subject,
			"role":    req.Role,
		}

	default:
		c.JSON(400, gin.H{"error": "Invalid rule type"})
		return
	}

	if success {
		// 保存到数据库
		h.Service.Enforcer.SavePolicy()

		// 同步到CSV
		h.syncToCSV()

		// 记录审计日志
		if h.AuditHandler != nil {
			user := c.GetHeader("User")
			if user == "" {
				user = "admin" // 默认用户
			}
			h.AuditHandler.LogAudit(user, "rule_added", "rules", auditDetails, true, c)
		}

		c.JSON(200, gin.H{
			"success": true,
			"message": message,
		})
	} else {
		c.JSON(400, gin.H{
			"success": false,
			"error":   "Rule already exists",
		})
	}
}

// 更新规则
func (h *RuleManagementHandler) UpdateRule(c *gin.Context) {
	ruleID := c.Param("id")
	var req RuleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": "Invalid request format"})
		return
	}

	// 先删除旧规则，再添加新规则
	if err := h.deleteRuleByID(ruleID); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	// 添加新规则
	var success bool
	var auditDetails interface{}

	switch req.Type {
	case "policy":
		if req.Effect == "" {
			req.Effect = "allow"
		}
		success, _ = h.Service.Enforcer.AddPolicy(req.Subject, req.Domain, req.Object, req.Action, req.Effect)
		auditDetails = gin.H{
			"type":    "policy",
			"subject": req.Subject,
			"domain":  req.Domain,
			"object":  req.Object,
			"action":  req.Action,
			"effect":  req.Effect,
		}

	case "role":
		success, _ = h.Service.Enforcer.AddRoleForUser(req.Subject, req.Role)
		auditDetails = gin.H{
			"type":    "role",
			"subject": req.Subject,
			"role":    req.Role,
		}

	default:
		c.JSON(400, gin.H{"error": "Invalid rule type"})
		return
	}

	if success {
		// 保存到数据库
		h.Service.Enforcer.SavePolicy()

		// 同步到CSV
		h.syncToCSV()

		// 记录审计日志
		if h.AuditHandler != nil {
			user := c.GetHeader("User")
			if user == "" {
				user = "admin" // 默认用户
			}
			h.AuditHandler.LogAudit(user, "rule_updated", "rules", auditDetails, true, c)
		}

		c.JSON(200, gin.H{
			"success": true,
			"message": "Rule updated successfully",
		})
	} else {
		c.JSON(400, gin.H{
			"success": false,
			"error":   "Failed to update rule",
		})
	}
}

// 删除规则
func (h *RuleManagementHandler) DeleteRule(c *gin.Context) {
	var ruleToDelete Rule
	if err := c.ShouldBindJSON(&ruleToDelete); err != nil {
		c.JSON(400, gin.H{"error": "无效的请求格式", "details": err.Error()})
		return
	}

	var success bool
	var err error

	switch ruleToDelete.Type {
	case "policy":
		policyStr := []string{ruleToDelete.Subject, ruleToDelete.Domain, ruleToDelete.Object, ruleToDelete.Action}
		if ruleToDelete.Effect != "" && ruleToDelete.Effect != "allow" { // Deny规则有5个部分
			policyStr = append(policyStr, ruleToDelete.Effect)
		}
		// 转换为 []interface{}
		policy := make([]interface{}, len(policyStr))
		for i, v := range policyStr {
			policy[i] = v
		}
		success, err = h.Service.Enforcer.RemovePolicy(policy...)
	case "role":
		success, err = h.Service.Enforcer.RemoveGroupingPolicy(ruleToDelete.Subject, ruleToDelete.Role)
	default:
		c.JSON(400, gin.H{"error": "未知的规则类型"})
		return
	}

	if err != nil {
		c.JSON(500, gin.H{"error": "删除规则时出错", "details": err.Error()})
		return
	}
	if !success {
		c.JSON(404, gin.H{"error": "规则未找到或已被删除"})
		return
	}

	// 保存到数据库
	h.Service.Enforcer.SavePolicy()

	// 同步到CSV
	h.syncToCSV()

	// 记录审计日志
	if h.AuditHandler != nil {
		user := c.GetHeader("User")
		if user == "" {
			user = "admin" // 默认用户
		}
		h.AuditHandler.LogAudit(user, "rule_deleted", "rules", gin.H{"deletedRule": ruleToDelete}, true, c)
	}

	c.JSON(200, gin.H{
		"success": true,
		"message": "Rule deleted successfully",
	})
}

// 根据ID删除规则 (此方法已不再被新的DeleteRule使用，但保留以兼容旧的批量删除逻辑)
func (h *RuleManagementHandler) deleteRuleByID(ruleID string) error {
	parts := strings.Split(ruleID, "_")
	if len(parts) != 2 {
		return fmt.Errorf("invalid rule ID format")
	}

	ruleType := parts[0]
	index, err := strconv.Atoi(parts[1])
	if err != nil {
		return fmt.Errorf("invalid rule index")
	}

	switch ruleType {
	case "p":
		policies, _ := h.Service.Enforcer.GetPolicy()
		if index >= len(policies) {
			return fmt.Errorf("rule not found")
		}
		policy := policies[index]
		// 转换为 []interface{}
		policyArgs := make([]interface{}, len(policy))
		for i, v := range policy {
			policyArgs[i] = v
		}
		h.Service.Enforcer.RemovePolicy(policyArgs...)

	case "g":
		groupings, _ := h.Service.Enforcer.GetGroupingPolicy()
		if index >= len(groupings) {
			return fmt.Errorf("rule not found")
		}
		grouping := groupings[index]
		// 转换为 []interface{}
		groupingArgs := make([]interface{}, len(grouping))
		for i, v := range grouping {
			groupingArgs[i] = v
		}
		h.Service.Enforcer.RemoveGroupingPolicy(groupingArgs...)

	default:
		return fmt.Errorf("unknown rule type")
	}

	return nil
}

// 批量操作
func (h *RuleManagementHandler) BatchOperation(c *gin.Context) {
	var req struct {
		Operation string   `json:"operation"` // "delete", "disable", "enable"
		RuleIDs   []string `json:"ruleIds"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": "Invalid request format"})
		return
	}

	successCount := 0
	var errors []string

	for _, ruleID := range req.RuleIDs {
		switch req.Operation {
		case "delete":
			if err := h.deleteRuleByID(ruleID); err != nil {
				errors = append(errors, fmt.Sprintf("Failed to delete rule %s: %s", ruleID, err.Error()))
			} else {
				successCount++
			}
		// 注意：禁用/启用功能需要额外的数据结构支持，这里先留空
		case "disable":
			// TODO: 实现禁用逻辑
		case "enable":
			// TODO: 实现启用逻辑
		default:
			errors = append(errors, fmt.Sprintf("Unknown operation: %s", req.Operation))
		}
	}

	// 保存更改
	h.Service.Enforcer.SavePolicy()
	h.syncToCSV()

	// 记录审计日志
	if h.AuditHandler != nil {
		user := c.GetHeader("User")
		if user == "" {
			user = "admin" // 默认用户
		}
		h.AuditHandler.LogAudit(user, "batch_operation", "rules", gin.H{
			"operation":    req.Operation,
			"ruleIds":      req.RuleIDs,
			"successCount": successCount,
			"errors":       errors,
		}, len(errors) == 0, c)
	}

	c.JSON(200, gin.H{
		"successCount": successCount,
		"totalCount":   len(req.RuleIDs),
		"errors":       errors,
	})
}

// 同步到CSV文件
func (h *RuleManagementHandler) syncToCSV() error {
	csvPath := "config/policy_kb_and_deny.csv"

	// 创建临时文件
	tmpFile, err := os.Create(csvPath + ".tmp")
	if err != nil {
		return err
	}
	defer tmpFile.Close()

	// 写入UTF-8 BOM，确保Excel等软件正确识别中文编码
	tmpFile.Write([]byte{0xEF, 0xBB, 0xBF})

	writer := csv.NewWriter(tmpFile)
	defer writer.Flush()

	// 写入头部注释
	writer.Write([]string{"# ==== 用户准入和基本用户组 ====\n"})
	writer.Write([]string{"# 基本组。允许继承 -> 主要组。根据每个组的优先级，返回主要组。\n"})
	writer.Write([]string{"# group-student\n"})
	writer.Write([]string{"# group-staff\n"})
	writer.Write([]string{"# group-unlimited\n"})
	writer.Write([]string{"\n"})

	// 写入策略规则
	policies, _ := h.Service.Enforcer.GetPolicy()
	for _, policy := range policies {
		record := append([]string{"p"}, policy...)
		writer.Write(record)
	}

	writer.Write([]string{"\n"})

	// 写入角色继承规则
	groupings, _ := h.Service.Enforcer.GetGroupingPolicy()
	for _, grouping := range groupings {
		record := append([]string{"g"}, grouping...)
		writer.Write(record)
	}

	// 替换原文件
	return os.Rename(csvPath+".tmp", csvPath)
}

// ImportRules 从上传的文件或文本内容导入规则
func (h *RuleManagementHandler) ImportRules(c *gin.Context) {
	var req struct {
		Content string `json:"content"`
		Replace bool   `json:"replace"`
	}

	// 尝试从 multipart form 获取文件
	file, err := c.FormFile("file")
	if err == nil {
		// 从文件读取
		f, _ := file.Open()
		defer f.Close()
		contentBytes, _ := io.ReadAll(f)
		req.Content = string(contentBytes)
		req.Replace = c.PostForm("replace") == "true"
	} else {
		// 从 JSON body 读取
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(400, gin.H{"error": "无效的请求格式。请提供JSON body或上传文件。"})
			return
		}
	}

	if err := h.Service.LoadPoliciesFromContent(req.Content, req.Replace); err != nil {
		c.JSON(400, gin.H{"error": "规则导入失败", "details": err.Error()})
		return
	}

	// 记录审计日志
	user := c.GetHeader("User")
	if user == "" {
		user = "admin"
	}
	h.AuditHandler.LogAudit(user, "rules_imported", "rules", gin.H{"replace": req.Replace}, true, c)

	c.JSON(200, gin.H{"success": true, "message": "规则导入成功"})
}
