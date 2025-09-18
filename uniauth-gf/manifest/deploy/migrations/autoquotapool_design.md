# 自动配额池配置系统设计说明

## 概述

本系统设计用于根据用户信息的多个维度自动分配配额池，支持复杂的OR/AND条件组合，并提供高效的双向查询功能。

## 核心特性

1. **多维度匹配**：支持基于用户信息的所有字段进行匹配
2. **双向查询**：既可以通过规则查询用户，也可以通过用户查询配额池
3. **灵活组合**：支持复杂的OR/AND逻辑条件组合
4. **高效查询**：通过精心设计的索引和视图优化查询性能
5. **多对多关系**：用户和配额池之间支持多对多映射

## 数据库设计

### 1. 表结构

#### auto_quota_pool_rules（规则表）
- 存储规则基本信息和目标配额池
- 支持优先级排序
- 支持启用/禁用状态

#### auto_quota_pool_conditions（条件表）
- 存储具体的匹配条件
- 支持树形结构构建复杂逻辑
- 支持多种操作符（equals, in, not_in, contains, regex等）

#### auto_quota_pool_mappings（映射表）
- 存储用户与配额池的实际映射关系
- 支持多对多关系
- 记录匹配时间和规则来源

### 2. 索引设计

#### 性能优化索引
- 规则表：enabled, priority, quota_pool_names (GIN)
- 条件表：rule_id, parent_condition_id, field_name
- 映射表：user_upn, quota_pool_name, rule_id
- 复合索引：支持双向查询优化

#### 查询优化
- 使用GIN索引支持数组和JSONB查询
- 复合索引优化常见查询模式
- 视图封装复杂查询逻辑

### 3. 视图和函数

#### 视图
- `v_user_quota_pool_mappings`：用户配额池映射详情
- `v_quota_pool_users`：配额池用户详情

#### 函数
- `get_user_quota_pools(user_upn)`：根据用户查询配额池
- `get_quota_pool_users(quota_pool_name)`：根据配额池查询用户
- `reevaluate_all_rules()`：重新评估所有规则（完整版本）
- `preview_rule_matches(rule_id, limit)`：预览规则匹配结果

## 使用场景

### 1. 基本查询
```sql
-- 查询用户的所有配额池
SELECT * FROM get_user_quota_pools('student001@link.cuhk.edu.cn');

-- 查询配额池的所有用户
SELECT * FROM get_quota_pool_users('student_basic');
```

### 2. 复杂条件匹配
```sql
-- 创建复杂规则：教职员 OR 博士研究生
INSERT INTO auto_quota_pool_rules (rule_name, description, priority, quota_pool_names) 
VALUES ('高级用户规则', '教职员或博士研究生', 3, ARRAY['premium_pool']);

-- 添加OR条件组
-- 教职员条件：identity_type IN ('Fulltime', 'Parttime')
-- 博士条件：student_category_detail = 'Ph.D.'
```

### 3. 统计和分析
```sql
-- 统计每个配额池的用户数量
SELECT quota_pool_name, COUNT(*) as user_count
FROM auto_quota_pool_mappings
GROUP BY quota_pool_name;
```

## 性能考虑

### 1. 查询优化
- 使用复合索引优化常见查询模式
- 视图封装复杂查询，提高代码复用性
- 函数提供标准化的查询接口

### 2. 索引策略
- 为高频查询字段创建索引
- 使用GIN索引支持数组和JSONB查询
- 复合索引优化多字段查询

### 3. 数据维护
- 定期清理无效映射
- 监控查询性能
- 根据使用模式调整索引

## 扩展性

### 1. 新增字段支持
- 在条件表中添加新的field_name
- 支持新的操作符类型
- 保持向后兼容性

### 2. 复杂逻辑支持
- 通过条件树支持任意复杂的逻辑组合
- 支持嵌套的OR/AND条件
- 支持条件优先级排序

### 3. 性能扩展
- 支持分区表（按时间或用户范围）
- 支持读写分离
- 支持缓存层

## 维护建议

### 1. 定期维护
- 清理无效映射
- 更新统计信息
- 监控查询性能

### 2. 数据一致性
- 确保用户信息变更时更新映射
- 定期验证映射的准确性
- 监控规则的有效性

### 3. 性能监控
- 监控慢查询
- 分析索引使用情况
- 优化查询计划

## 注意事项

1. **数据一致性**：用户信息变更时需要重新评估相关规则
2. **性能影响**：复杂规则可能影响评估性能，建议合理设置优先级
3. **存储空间**：映射表会随着用户和规则增长，需要定期清理
4. **并发控制**：规则评估时需要考虑并发访问的影响

## 总结

本设计在匹配效率和设计复杂度之间取得了良好的平衡，通过三层架构（规则-条件-映射）实现了灵活的匹配逻辑，通过精心设计的索引和视图提供了高效的查询性能，同时保持了良好的扩展性和可维护性。
