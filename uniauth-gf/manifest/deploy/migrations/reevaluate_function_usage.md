# reevaluate_all_rules 函数使用说明

## 概述

`reevaluate_all_rules` 函数是自动配额池配置系统的核心函数，用于重新评估所有启用的规则，并根据用户信息自动分配配额池。

## 函数特性

### 1. 核心功能
- **重新评估所有规则**：按优先级顺序评估所有启用的规则
- **复杂条件支持**：支持嵌套的OR/AND逻辑组合
- **多种操作符**：支持equals、in、not_in、contains、regex等操作符
- **性能监控**：返回每个规则的执行时间和匹配用户数
- **错误处理**：单个规则出错不影响其他规则的执行

### 2. 返回值
函数返回一个表，包含以下字段：
- `rule_id`：规则ID
- `rule_name`：规则名称
- `matched_users`：匹配的用户数量
- `execution_time_ms`：执行时间（毫秒）

## 使用方法

### 基本用法
```sql
-- 执行所有规则的重新评估
SELECT * FROM reevaluate_all_rules();
```

### 查看评估结果
```sql
-- 查看评估结果，按匹配用户数排序
SELECT 
    rule_name,
    matched_users,
    execution_time_ms,
    ROUND(execution_time_ms::NUMERIC / 1000, 2) as execution_time_seconds
FROM reevaluate_all_rules()
ORDER BY matched_users DESC;
```

### 监控性能
```sql
-- 监控规则执行性能
SELECT 
    rule_name,
    matched_users,
    execution_time_ms,
    CASE 
        WHEN execution_time_ms > 1000 THEN 'SLOW'
        WHEN execution_time_ms > 500 THEN 'MEDIUM'
        ELSE 'FAST'
    END as performance_level
FROM reevaluate_all_rules()
ORDER BY execution_time_ms DESC;
```

## 支持的操作符

### 1. 基本比较操作符
- `equals`：等于
- `not_equals`：不等于
- `in`：在列表中
- `not_in`：不在列表中

### 2. 字符串操作符
- `contains`：包含（不区分大小写）
- `not_contains`：不包含（不区分大小写）
- `starts_with`：以...开始
- `ends_with`：以...结束
- `regex`：正则表达式匹配

### 3. 空值操作符
- `is_null`：为空
- `is_not_null`：不为空

### 4. 数组操作符
- `array_contains`：数组包含（用于tags字段）

## 条件组合示例

### 1. 简单AND条件
```sql
-- 条件：身份类型 = 'Student' AND 在校状态 = 'In-School'
INSERT INTO auto_quota_pool_conditions (rule_id, condition_type, field_name, operator, field_value, sort_order)
VALUES (rule_id, 'field', 'identity_type', 'equals', 'Student', 1);

INSERT INTO auto_quota_pool_conditions (rule_id, condition_type, field_name, operator, field_value, sort_order)
VALUES (rule_id, 'field', 'school_status', 'equals', 'In-School', 2);
```

### 2. 复杂OR/AND组合
```sql
-- 条件：(身份类型 IN ('Fulltime', 'Parttime')) OR (学生类别 = 'Ph.D.')
-- 创建顶层OR组
INSERT INTO auto_quota_pool_conditions (rule_id, condition_type, logical_operator, sort_order)
VALUES (rule_id, 'group', 'OR', 1);

-- 获取组ID后添加子条件
-- 教职员条件
INSERT INTO auto_quota_pool_conditions (rule_id, parent_condition_id, condition_type, field_name, operator, field_values, sort_order)
VALUES (rule_id, group_id, 'field', 'identity_type', 'in', ARRAY['Fulltime', 'Parttime'], 1);

-- 博士条件
INSERT INTO auto_quota_pool_conditions (rule_id, parent_condition_id, condition_type, field_name, operator, field_value, sort_order)
VALUES (rule_id, group_id, 'field', 'student_category_detail', 'equals', 'Ph.D.', 2);
```

## 性能优化建议

### 1. 规则优先级
- 将匹配用户数多的规则设置更高的优先级（数值更小）
- 将复杂规则设置较低的优先级

### 2. 条件优化
- 优先使用索引字段进行匹配
- 避免使用过于复杂的正则表达式
- 合理使用IN操作符而不是多个OR条件

### 3. 定期维护
- 定期清理无效的映射关系
- 监控规则执行性能
- 根据实际使用情况调整规则

## 错误处理

### 1. 常见错误
- **无效字段名**：确保字段名在允许列表中
- **无效操作符**：使用支持的操作符
- **SQL语法错误**：检查条件构建是否正确

### 2. 调试方法
```sql
-- 测试单个规则的条件构建
SELECT build_condition_tree(rule_id) 
FROM auto_quota_pool_rules 
WHERE rule_name = '规则名称';

-- 测试单个字段条件
SELECT build_field_condition('identity_type', 'equals', 'Student', NULL);
```

## 监控和维护

### 1. 执行监控
```sql
-- 查看规则执行历史
SELECT 
    rule_name,
    last_evaluated_at,
    enabled,
    priority
FROM auto_quota_pool_rules
ORDER BY last_evaluated_at DESC;
```

### 2. 映射统计
```sql
-- 查看映射统计
SELECT 
    quota_pool_name,
    COUNT(*) as user_count,
    COUNT(DISTINCT user_upn) as unique_users
FROM auto_quota_pool_mappings
GROUP BY quota_pool_name
ORDER BY user_count DESC;
```

### 3. 性能分析
```sql
-- 分析慢规则
SELECT 
    rule_name,
    matched_users,
    execution_time_ms,
    ROUND(matched_users::NUMERIC / NULLIF(execution_time_ms, 0), 2) as users_per_ms
FROM reevaluate_all_rules()
WHERE execution_time_ms > 1000
ORDER BY execution_time_ms DESC;
```

## 注意事项

1. **数据一致性**：执行前确保用户信息表是最新的
2. **并发控制**：避免在系统高负载时执行
3. **备份**：执行前建议备份映射表数据
4. **监控**：执行后检查结果是否符合预期

## 示例场景

### 场景1：学生配额池分配
```sql
-- 为在校学生分配基础配额池
-- 条件：身份类型 = 'Student' AND 在校状态 IN ('In-School', 'Employed')
```

### 场景2：教职员高级配额池
```sql
-- 为教职员分配高级配额池
-- 条件：身份类型 IN ('Fulltime', 'Parttime') AND 在校状态 = 'Employed'
```

### 场景3：研究用户配额池
```sql
-- 为研究相关用户分配研究配额池
-- 条件：(标签包含'research') OR (学生类别 = 'Ph.D.') OR (部门包含'研究')
```

这个函数提供了强大而灵活的规则评估能力，能够满足各种复杂的用户配额池分配需求。
