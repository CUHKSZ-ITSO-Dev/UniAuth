package services

import (
	"bytes"
	"encoding/csv"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"strconv"
	"strings"
	"time"

	"uniauth/internal/models"

	"github.com/casbin/casbin/v2"
	gormadapter "github.com/casbin/gorm-adapter/v3"
	"gorm.io/gorm"
)

// UniAuthService 结构体
// 包含Casbin的enforcer和Gorm的db
type AuthService struct {
	Enforcer *casbin.Enforcer
	DB       *gorm.DB
}

// ========== 初始化 ==========

// 初始化Casbin RBAC服务
func NewAuthService(db *gorm.DB) (*AuthService, error) {
	// 创建适配器
	adapter, err := gormadapter.NewAdapterByDB(db)
	if err != nil {
		return nil, fmt.Errorf("新建适配器: %w", err)
	}

	// 创建enforcer
	enforcer, err := casbin.NewEnforcer("configs/core_rbac.conf", adapter)
	if err != nil {
		return nil, fmt.Errorf("新建enforcer: %w", err)
	}

	// 加载策略
	if err := enforcer.LoadPolicy(); err != nil {
		return nil, fmt.Errorf("加载策略: %w", err)
	}

	// 创建服务实例
	service := &AuthService{
		Enforcer: enforcer,
		DB:       db,
	}

	return service, nil
}

// ========== 权限级别定义 ==========

// 权限级别定义（从低到高）
const (
	PermLevelNone   = 0
	PermLevelSearch = 1 // 可检索
	PermLevelRead   = 2 // 可读
	PermLevelWrite  = 3 // 读写
	PermLevelAdmin  = 4 // 管理员
)

// 权限级别映射
var PermLevelMap = map[string]int{
	"search": PermLevelSearch,
	"read":   PermLevelRead,
	"write":  PermLevelWrite,
	"admin":  PermLevelAdmin,
}

// LoadPoliciesFromContent 从文本内容中加载权限策略，并确保原子性
func (s *AuthService) LoadPoliciesFromContent(content string, replace bool) error {
	// 1. 创建一个临时的内存enforcer用于验证
	tempEnforcer, err := casbin.NewEnforcer("configs/core_rbac.conf")
	if err != nil {
		return fmt.Errorf("创建临时验证器失败: %w", err)
	}

	// 2. 模拟CSV读取
	reader := csv.NewReader(strings.NewReader(content))
	reader.FieldsPerRecord = -1
	reader.TrimLeadingSpace = true
	records, err := reader.ReadAll()
	if err != nil {
		return fmt.Errorf("解析内容失败: %w", err)
	}

	// 3. 在临时enforcer中验证所有规则
	for lineNum, record := range records {
		if len(record) == 0 || (len(record) > 0 && strings.HasPrefix(strings.TrimSpace(record[0]), "#")) {
			continue // 跳过空行和注释
		}

		var cleanRecord []string
		for _, field := range record {
			field = strings.TrimSpace(field)
			if strings.Contains(field, "#") {
				field = strings.TrimSpace(strings.Split(field, "#")[0])
			}
			if field != "" {
				cleanRecord = append(cleanRecord, field)
			}
		}
		if len(cleanRecord) == 0 {
			continue
		}
		record = cleanRecord

		var success bool
		var addErr error
		switch record[0] {
		case "p":
			if len(record) < 5 {
				return fmt.Errorf("第%d行策略格式错误: %v", lineNum+1, record)
			}
			policy := make([]interface{}, len(record)-1)
			for i, v := range record[1:] {
				policy[i] = v
			}
			success, addErr = tempEnforcer.AddPolicy(policy...)
		case "g":
			if len(record) < 3 {
				return fmt.Errorf("第%d行角色分配格式错误: %v", lineNum+1, record)
			}
			policy := make([]interface{}, len(record)-1)
			for i, v := range record[1:] {
				policy[i] = v
			}
			success, addErr = tempEnforcer.AddGroupingPolicy(policy...)
		default:
			return fmt.Errorf("第%d行未知的策略类型: %s", lineNum+1, record[0])
		}

		if !success || addErr != nil {
			return fmt.Errorf("第%d行规则验证失败: %v (错误: %v)", lineNum+1, record, addErr)
		}
	}

	// 4. 如果所有规则都验证通过，则应用到主enforcer
	if replace {
		log.Println("替换模式：清空所有现有规则")
		s.Enforcer.ClearPolicy()
	}

	allPolicies, _ := tempEnforcer.GetPolicy()
	allGroupings, _ := tempEnforcer.GetGroupingPolicy()

	if len(allPolicies) > 0 {
		s.Enforcer.AddPolicies(allPolicies)
	}
	if len(allGroupings) > 0 {
		s.Enforcer.AddGroupingPolicies(allGroupings)
	}

	log.Printf("成功应用 %d 条策略和 %d 条角色分配规则", len(allPolicies), len(allGroupings))

	return s.Enforcer.SavePolicy()
}

// 从CSV文件加载权限策略
func (s *AuthService) LoadPoliciesFromCSV(csvPath string) error {
	// 检查文件是否存在
	if _, err := os.Stat(csvPath); os.IsNotExist(err) {
		return fmt.Errorf("CSV文件不存在: %s", csvPath)
	}

	// 打开CSV文件
	file, err := os.Open(csvPath)
	if err != nil {
		return fmt.Errorf("打开CSV文件失败: %w", err)
	}
	defer file.Close()

	// 创建CSV读取器
	reader := csv.NewReader(file)
	reader.FieldsPerRecord = -1 // 允许可变字段数量
	reader.TrimLeadingSpace = true

	// 读取所有记录
	records, err := reader.ReadAll()
	if err != nil {
		return fmt.Errorf("读取CSV文件失败: %w", err)
	}

	// 统计导入的策略数量
	var policyCount, roleCount int

	// 处理每一行
	for lineNum, record := range records {
		// 跳过空行
		if len(record) == 0 {
			continue
		}

		// 跳过注释行（整行以#开头）
		if len(record) > 0 && strings.HasPrefix(strings.TrimSpace(record[0]), "#") {
			continue
		}

		// 清理记录中的空白字符并移除行内注释
		var cleanRecord []string
		for _, field := range record {
			field = strings.TrimSpace(field)
			// 移除行内注释（# 后面的内容）
			if strings.Contains(field, "#") {
				field = strings.TrimSpace(strings.Split(field, "#")[0])
			}
			// 只保留非空字段
			if field != "" {
				cleanRecord = append(cleanRecord, field)
			}
		}

		// 跳过处理后的空记录
		if len(cleanRecord) == 0 {
			continue
		}

		record = cleanRecord

		// 处理策略行
		switch record[0] {
		case "p":
			// 权限策略: p, subject, resource_type, resource_id, action [, effect]
			if len(record) < 5 {
				log.Printf("第%d行: 权限策略格式错误，需要至少5个字段: %v", lineNum+1, record)
				continue
			}

			subject := record[1]
			resourceType := record[2]
			resourceID := record[3]
			action := record[4]
			effect := "allow" // 默认为allow

			if len(record) > 5 && record[5] != "" {
				effect = record[5]
			}

			// 添加策略（总是包含effect字段）
			success, _ := s.Enforcer.AddPolicy(subject, resourceType, resourceID, action, effect)

			if success {
				policyCount++
				log.Printf("导入权限策略: %s -> %s %s %s (%s)", subject, resourceType, resourceID, action, effect)
			}

		case "g":
			// 角色继承: g, user, role
			if len(record) < 3 {
				log.Printf("第%d行: 角色继承格式错误，需要至少3个字段: %v", lineNum+1, record)
				continue
			}

			user := record[1]
			role := record[2]

			// 添加角色继承
			success, _ := s.Enforcer.AddRoleForUser(user, role)
			if success {
				roleCount++
				log.Printf("导入角色继承: %s -> %s", user, role)
			}

		default:
			log.Printf("第%d行: 未知的策略类型 '%s'，跳过: %v", lineNum+1, record[0], record)
		}
	}

	// 保存策略到数据库
	if err := s.Enforcer.SavePolicy(); err != nil {
		return fmt.Errorf("保存策略到数据库失败: %w", err)
	}

	log.Printf("成功从 %s 导入策略: %d个权限策略, %d个角色继承", csvPath, policyCount, roleCount)
	return nil
}

// ========== 规则导出 ==========

// ExportAllRulesAsCSV 导出所有规则为CSV格式
func (s *AuthService) ExportAllRulesAsCSV() ([]byte, error) {
	var buffer bytes.Buffer

	// 写入UTF-8 BOM，确保Excel等软件正确识别中文编码
	buffer.Write([]byte{0xEF, 0xBB, 0xBF})

	writer := csv.NewWriter(&buffer)

	// 写入文件头和注释
	writer.Write([]string{fmt.Sprintf("# UniAuth 全规则导出, 生成于: %s", time.Now().Format(time.RFC3339))})
	writer.Write([]string{""}) // 空行

	// 1. 导出策略规则 (p)
	writer.Write([]string{"# === 策略规则 (p) ==="})
	writer.Write([]string{"# 格式: p, subject, domain, object, action, effect"})
	policies, err := s.Enforcer.GetPolicy()
	if err != nil {
		return nil, err
	}
	for _, policy := range policies {
		record := append([]string{"p"}, policy...)
		writer.Write(record)
	}
	writer.Write([]string{""}) // 空行

	// 2. 导出角色分配 (g)
	writer.Write([]string{"# === 角色分配 (g) ==="})
	writer.Write([]string{"# 格式: g, user, role"})
	groupings, err := s.Enforcer.GetGroupingPolicy()
	if err != nil {
		return nil, err
	}
	for _, grouping := range groupings {
		record := append([]string{"g"}, grouping...)
		writer.Write(record)
	}
	writer.Write([]string{""}) // 空行

	// 3. 导出抽象组定义
	writer.Write([]string{"# === 抽象组定义 (abstract) ==="})
	writer.Write([]string{"# 格式: abstract, id, name, type, description, rule_json"})
	var abstractGroups []models.AbstractGroup
	if result := s.DB.Find(&abstractGroups); result.Error != nil {
		return nil, result.Error
	}
	for _, group := range abstractGroups {
		ruleJson, _ := json.Marshal(group.Rule)
		record := []string{"abstract", strconv.FormatUint(uint64(group.ID), 10), group.Name, group.Type, group.Description, string(ruleJson)}
		writer.Write(record)
	}

	writer.Flush()

	return buffer.Bytes(), nil
}

// 智能权限检查 - 根据资源类型选择合适的检查逻辑
func (s *AuthService) SmartPermissionCheck(upn, resource, resourceID, action string) (bool, string, int) {
	switch resource {
	case "doc":
		// 文档权限：实现继承逻辑
		return s.checkDocumentPermissionSmart(upn, resourceID, action)
	default:
		// 其他资源（包括kb）：直接检查
		allowed, _ := s.Enforcer.Enforce(upn, resource, resourceID, action)
		permLevel, exists := PermLevelMap[action]
		if !exists {
			// 如果action不在映射中，使用默认级别
			permLevel = PermLevelNone
		}
		return allowed, action, permLevel
	}
}

// 智能文档权限检查（带继承逻辑，不支持通配符）
func (s *AuthService) checkDocumentPermissionSmart(upn, resourceID, action string) (bool, string, int) {
	// 必须是 knowledgeBaseId/documentId 格式
	if !strings.Contains(resourceID, "/") {
		log.Printf("Invalid document resource format: %s (must be kbId/docId)", resourceID)
		return false, "none", PermLevelNone
	}

	// 解析知识库ID和文档ID
	parts := strings.SplitN(resourceID, "/", 2)
	if len(parts) != 2 {
		log.Printf("Invalid document resource format: %s", resourceID)
		return false, "none", PermLevelNone
	}

	knowledgeBaseID := parts[0]

	requiredPerm, exists := PermLevelMap[action]
	if !exists {
		log.Printf("Unknown action '%s' for document permission check", action)
		return false, "none", PermLevelNone
	}

	// 先检查文档级别权限
	if allowed, _ := s.Enforcer.Enforce(upn, "doc", resourceID, action); allowed {
		log.Printf("Document permission granted - UPN: %s, Doc: %s, Action: %s (direct)", upn, resourceID, action)
		return true, action, requiredPerm
	}

	// 再检查知识库级别权限
	if allowed, _ := s.Enforcer.Enforce(upn, "kb", knowledgeBaseID, action); allowed {
		log.Printf("Document permission granted - UPN: %s, Doc: %s, Action: %s (inherited from KB)", upn, resourceID, action)
		return true, action, requiredPerm
	}

	// 检查是否有更高级别的权限
	for checkAction, level := range PermLevelMap {
		if level > requiredPerm {
			// 先检查文档级别
			if allowed, _ := s.Enforcer.Enforce(upn, "doc", resourceID, checkAction); allowed {
				log.Printf("Document permission granted - UPN: %s, Doc: %s, Required: %s, Granted: %s (direct higher)", upn, resourceID, action, checkAction)
				return true, checkAction, level
			}
			// 再检查知识库级别
			if allowed, _ := s.Enforcer.Enforce(upn, "kb", knowledgeBaseID, checkAction); allowed {
				log.Printf("Document permission granted - UPN: %s, Doc: %s, Required: %s, Granted: %s (inherited higher)", upn, resourceID, action, checkAction)
				return true, checkAction, level
			}
		}
	}

	log.Printf("Document permission denied - UPN: %s, Doc: %s, Action: %s", upn, resourceID, action)
	return false, "none", PermLevelNone
}

// ========== 基础权限检查 ==========

// 解析真实UPN（处理API Key）
func (s *AuthService) ResolveRealUPN(subject string) string {
	// 如果subject不是API Key，直接返回
	if !strings.HasPrefix(subject, "api:") {
		return subject
	}

	// 约定好定义 g api:key UPN，并且一个api:key只能对应一个UPN
	roles, _ := s.Enforcer.GetRolesForUser(subject)
	for _, role := range roles {
		if strings.Contains(role, "@") {
			return role
		}
	}

	return subject
}

// 统计用户权限数量
func (s *AuthService) CountUserPermissions(upn string) int {
	perms, _ := s.Enforcer.GetPermissionsForUser(upn)
	return len(perms)
}

// 转换布尔值为权限字符串
func BoolToPermission(allowed bool) string {
	if allowed {
		return "access"
	}
	return "none"
}
