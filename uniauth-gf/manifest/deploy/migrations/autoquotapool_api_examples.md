# 自动配额池配置 API 使用示例

## 概述

本文档提供了自动配额池配置系统的完整API使用示例，包括规则管理、条件配置、映射查询和规则评估等功能。

## API 接口分类

### 1. 规则管理接口
- 获取规则列表
- 获取规则详情
- 新增规则
- 编辑规则
- 删除规则

### 2. 条件管理接口
- 获取条件列表
- 新增条件
- 编辑条件
- 删除条件

### 3. 映射查询接口
- 根据用户查询配额池
- 根据配额池查询用户
- 获取映射列表

### 4. 规则评估接口
- 重新评估所有规则
- 测试规则

### 5. 统计接口
- 获取统计信息

## 详细使用示例

### 1. 规则管理

#### 1.1 获取规则列表
```http
GET /api/v1/autoQuotaPool/rules?page=1&pageSize=20&enabled=true&includeStats=true
```

**响应示例：**
```json
{
  "rules": [
    {
      "id": 1,
      "ruleName": "学生配额池规则",
      "description": "为在校学生分配基础配额池",
      "enabled": true,
      "priority": 10,
      "quotaPoolNames": ["student_basic", "student_research"],
      "lastEvaluatedAt": "2024-01-15T10:30:00Z",
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-15T10:30:00Z",
      "matchedUsersCount": 150
    }
  ],
  "total": 1,
  "page": 1,
  "pageSize": 20,
  "totalPages": 1
}
```

#### 1.2 获取规则详情
```http
GET /api/v1/autoQuotaPool/rules/1
```

**响应示例：**
```json
{
  "rule": {
    "id": 1,
    "ruleName": "学生配额池规则",
    "description": "为在校学生分配基础配额池",
    "enabled": true,
    "priority": 10,
    "quotaPoolNames": ["student_basic", "student_research"],
    "lastEvaluatedAt": "2024-01-15T10:30:00Z",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  },
  "conditions": [
    {
      "id": 1,
      "ruleId": 1,
      "parentConditionId": null,
      "conditionType": "field",
      "logicalOperator": "AND",
      "fieldName": "identity_type",
      "operator": "equals",
      "fieldValue": "Student",
      "fieldValues": null,
      "sortOrder": 1,
      "createdAt": "2024-01-01T00:00:00Z"
    },
    {
      "id": 2,
      "ruleId": 1,
      "parentConditionId": null,
      "conditionType": "field",
      "logicalOperator": "AND",
      "fieldName": "school_status",
      "operator": "in",
      "fieldValue": null,
      "fieldValues": ["In-School", "Employed"],
      "sortOrder": 2,
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### 1.3 新增规则
```http
POST /api/v1/autoQuotaPool/rules
Content-Type: application/json

{
  "ruleName": "教职员配额池规则",
  "description": "为教职员分配高级配额池",
  "enabled": true,
  "priority": 5,
  "quotaPoolNames": ["faculty_premium", "faculty_research"],
  "conditions": [
    {
      "conditionType": "field",
      "logicalOperator": "AND",
      "fieldName": "identity_type",
      "operator": "in",
      "fieldValues": ["Fulltime", "Parttime"],
      "sortOrder": 1
    },
    {
      "conditionType": "field",
      "logicalOperator": "AND",
      "fieldName": "school_status",
      "operator": "equals",
      "fieldValue": "Employed",
      "sortOrder": 2
    }
  ]
}
```

**响应示例：**
```json
{
  "ruleId": 2,
  "ok": true
}
```

#### 1.4 编辑规则
```http
PUT /api/v1/autoQuotaPool/rules/2
Content-Type: application/json

{
  "id": 2,
  "ruleName": "教职员配额池规则（更新）",
  "description": "为教职员分配高级配额池，包含更多配额池",
  "enabled": true,
  "priority": 3,
  "quotaPoolNames": ["faculty_premium", "faculty_research", "faculty_computing"],
  "conditions": [
    {
      "conditionType": "field",
      "logicalOperator": "AND",
      "fieldName": "identity_type",
      "operator": "in",
      "fieldValues": ["Fulltime", "Parttime"],
      "sortOrder": 1
    }
  ]
}
```

**响应示例：**
```json
{
  "ok": true
}
```

#### 1.5 删除规则
```http
DELETE /api/v1/autoQuotaPool/rules/2
```

**响应示例：**
```json
{
  "ok": true
}
```

### 2. 条件管理

#### 2.1 获取规则的条件列表
```http
GET /api/v1/autoQuotaPool/rules/1/conditions
```

**响应示例：**
```json
{
  "conditions": [
    {
      "id": 1,
      "ruleId": 1,
      "parentConditionId": null,
      "conditionType": "field",
      "logicalOperator": "AND",
      "fieldName": "identity_type",
      "operator": "equals",
      "fieldValue": "Student",
      "fieldValues": null,
      "sortOrder": 1,
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### 2.2 新增条件
```http
POST /api/v1/autoQuotaPool/rules/1/conditions
Content-Type: application/json

{
  "ruleId": 1,
  "conditionType": "field",
  "logicalOperator": "AND",
  "fieldName": "department",
  "operator": "contains",
  "fieldValue": "计算机",
  "sortOrder": 3
}
```

**响应示例：**
```json
{
  "conditionId": 3,
  "ok": true
}
```

#### 2.3 编辑条件
```http
PUT /api/v1/autoQuotaPool/conditions/3
Content-Type: application/json

{
  "id": 3,
  "conditionType": "field",
  "logicalOperator": "AND",
  "fieldName": "department",
  "operator": "in",
  "fieldValues": ["计算机科学与工程系", "电子工程系"],
  "sortOrder": 3
}
```

**响应示例：**
```json
{
  "ok": true
}
```

#### 2.4 删除条件
```http
DELETE /api/v1/autoQuotaPool/conditions/3
```

**响应示例：**
```json
{
  "ok": true
}
```

### 3. 映射查询

#### 3.1 根据用户查询配额池
```http
GET /api/v1/autoQuotaPool/user/student001@link.cuhk.edu.cn/quotaPools
```

**响应示例：**
```json
{
  "userUpn": "student001@link.cuhk.edu.cn",
  "quotaPools": [
    {
      "id": 1,
      "userUpn": "student001@link.cuhk.edu.cn",
      "quotaPoolName": "student_basic",
      "ruleId": 1,
      "ruleName": "学生配额池规则",
      "matchedAt": "2024-01-15T10:30:00Z",
      "createdAt": "2024-01-15T10:30:00Z",
      "displayName": "张三",
      "department": "计算机科学与工程系",
      "identityType": "Student"
    }
  ],
  "total": 1
}
```

#### 3.2 根据配额池查询用户
```http
GET /api/v1/autoQuotaPool/quotaPool/student_basic/users?page=1&pageSize=20
```

**响应示例：**
```json
{
  "quotaPoolName": "student_basic",
  "users": [
    {
      "id": 1,
      "userUpn": "student001@link.cuhk.edu.cn",
      "quotaPoolName": "student_basic",
      "ruleId": 1,
      "ruleName": "学生配额池规则",
      "matchedAt": "2024-01-15T10:30:00Z",
      "createdAt": "2024-01-15T10:30:00Z",
      "displayName": "张三",
      "department": "计算机科学与工程系",
      "identityType": "Student"
    }
  ],
  "total": 150,
  "page": 1,
  "pageSize": 20,
  "totalPages": 8
}
```

#### 3.3 获取映射列表
```http
GET /api/v1/autoQuotaPool/mappings?quotaPoolName=student_basic&page=1&pageSize=20
```

**响应示例：**
```json
{
  "mappings": [
    {
      "id": 1,
      "userUpn": "student001@link.cuhk.edu.cn",
      "quotaPoolName": "student_basic",
      "ruleId": 1,
      "ruleName": "学生配额池规则",
      "matchedAt": "2024-01-15T10:30:00Z",
      "createdAt": "2024-01-15T10:30:00Z",
      "displayName": "张三",
      "department": "计算机科学与工程系",
      "identityType": "Student"
    }
  ],
  "total": 150,
  "page": 1,
  "pageSize": 20,
  "totalPages": 8
}
```

### 4. 规则评估

#### 4.1 重新评估所有规则
```http
POST /api/v1/autoQuotaPool/reevaluate
Content-Type: application/json

{
  "dryRun": false
}
```

**响应示例：**
```json
{
  "results": [
    {
      "ruleId": 1,
      "ruleName": "学生配额池规则",
      "matchedUsers": 150,
      "executionTimeMs": 250
    },
    {
      "ruleId": 2,
      "ruleName": "教职员配额池规则",
      "matchedUsers": 45,
      "executionTimeMs": 120
    }
  ],
  "total": 195,
  "ok": true
}
```

#### 4.2 测试规则
```http
POST /api/v1/autoQuotaPool/rules/test
Content-Type: application/json

{
  "ruleName": "测试规则",
  "description": "测试规则描述",
  "enabled": true,
  "priority": 100,
  "quotaPoolNames": ["test_pool"],
  "conditions": [
    {
      "conditionType": "field",
      "logicalOperator": "AND",
      "fieldName": "identity_type",
      "operator": "equals",
      "fieldValue": "Student",
      "sortOrder": 1
    }
  ],
  "testUserUpns": ["student001@link.cuhk.edu.cn"],
  "maxResults": 100
}
```

**响应示例：**
```json
{
  "matchedUsers": ["student001@link.cuhk.edu.cn", "student002@link.cuhk.edu.cn"],
  "total": 2,
  "sqlQuery": "SELECT upn FROM userinfos_user_infos WHERE identity_type = 'Student'",
  "ok": true
}
```

### 5. 统计信息

#### 5.1 获取统计信息
```http
GET /api/v1/autoQuotaPool/stats
```

**响应示例：**
```json
{
  "totalRules": 5,
  "enabledRules": 4,
  "totalMappings": 500,
  "totalUsers": 200,
  "totalQuotaPools": 8,
  "lastEvaluatedAt": "2024-01-15T10:30:00Z",
  "ruleStats": [
    {
      "ruleId": 1,
      "ruleName": "学生配额池规则",
      "matchedUsers": 150,
      "quotaPoolCount": 2,
      "lastEvaluatedAt": "2024-01-15T10:30:00Z"
    }
  ],
  "quotaPoolStats": [
    {
      "quotaPoolName": "student_basic",
      "userCount": 120,
      "ruleCount": 1
    }
  ]
}
```

## 复杂条件示例

### 1. OR/AND 组合条件
```json
{
  "ruleName": "高级用户配额池规则",
  "description": "为教职员或博士研究生分配高级配额池",
  "enabled": true,
  "priority": 3,
  "quotaPoolNames": ["premium_computing", "premium_research"],
  "conditions": [
    {
      "conditionType": "group",
      "logicalOperator": "OR",
      "sortOrder": 1,
      "conditions": [
        {
          "conditionType": "field",
          "logicalOperator": "AND",
          "fieldName": "identity_type",
          "operator": "in",
          "fieldValues": ["Fulltime", "Parttime"],
          "sortOrder": 1
        },
        {
          "conditionType": "field",
          "logicalOperator": "AND",
          "fieldName": "student_category_detail",
          "operator": "equals",
          "fieldValue": "Ph.D.",
          "sortOrder": 2
        }
      ]
    }
  ]
}
```

### 2. 复杂字段条件
```json
{
  "conditions": [
    {
      "conditionType": "field",
      "logicalOperator": "AND",
      "fieldName": "department",
      "operator": "contains",
      "fieldValue": "计算机",
      "sortOrder": 1
    },
    {
      "conditionType": "field",
      "logicalOperator": "AND",
      "fieldName": "tags",
      "operator": "array_contains",
      "fieldValues": ["research", "ai"],
      "sortOrder": 2
    },
    {
      "conditionType": "field",
      "logicalOperator": "AND",
      "fieldName": "funding_type_or_admission_year",
      "operator": "regex",
      "fieldValue": "^202[0-9]$",
      "sortOrder": 3
    }
  ]
}
```

## 错误处理

### 常见错误响应
```json
{
  "code": 400,
  "message": "参数验证失败",
  "data": {
    "field": "ruleName",
    "error": "规则名称不能为空"
  }
}
```

### 业务错误响应
```json
{
  "code": 409,
  "message": "规则名称已存在",
  "data": null
}
```

## 注意事项

1. **权限控制**：所有接口都需要适当的权限验证
2. **数据验证**：所有输入参数都会进行严格验证
3. **性能考虑**：大量数据查询时建议使用分页
4. **并发安全**：规则评估时需要考虑并发访问
5. **错误处理**：所有接口都有完善的错误处理机制

## 最佳实践

1. **规则设计**：优先使用简单条件，避免过于复杂的嵌套
2. **性能优化**：定期清理无效映射，监控规则执行性能
3. **测试验证**：新增规则前先使用测试接口验证
4. **监控告警**：设置规则执行失败的告警机制
5. **备份恢复**：定期备份规则配置，支持快速恢复
