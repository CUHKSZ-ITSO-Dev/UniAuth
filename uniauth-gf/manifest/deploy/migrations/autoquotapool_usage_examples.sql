-- =============================================
-- 自动配额池配置系统 - 使用示例和查询说明
-- =============================================

-- =============================================
-- 1. 基本查询示例
-- =============================================

-- 查询某个用户的所有配额池
SELECT * FROM get_user_quota_pools('student001@link.cuhk.edu.cn');

-- 查询某个配额池的所有用户
SELECT * FROM get_quota_pool_users('student_basic');

-- 使用视图查询用户配额池映射详情
SELECT * FROM v_user_quota_pool_mappings 
WHERE user_upn = 'student001@link.cuhk.edu.cn';

-- 使用视图查询配额池用户详情
SELECT * FROM v_quota_pool_users 
WHERE quota_pool_name = 'student_basic';

-- =============================================
-- 2. 复杂条件查询示例
-- =============================================

-- 查询所有在校研究生的配额池
SELECT DISTINCT m.quota_pool_name, r.rule_name
FROM auto_quota_pool_mappings m
JOIN auto_quota_pool_rules r ON m.rule_id = r.id
JOIN userinfos_user_infos u ON m.user_upn = u.upn
WHERE u.identity_type = 'Student'
  AND u.school_status = 'In-School'
  AND u.student_category_detail IN ('Master', 'Ph.D.')
  AND r.enabled = true;

-- 查询特定部门的所有用户及其配额池
SELECT 
    u.upn,
    u.display_name,
    u.department,
    m.quota_pool_name,
    r.rule_name
FROM userinfos_user_infos u
LEFT JOIN auto_quota_pool_mappings m ON u.upn = m.user_upn
LEFT JOIN auto_quota_pool_rules r ON m.rule_id = r.id AND r.enabled = true
WHERE u.department = '计算机科学与工程系'
ORDER BY u.display_name, m.quota_pool_name;

-- =============================================
-- 3. 规则管理示例
-- =============================================

-- 创建新的复杂规则：博士研究生配额池
INSERT INTO auto_quota_pool_rules (rule_name, description, priority, quota_pool_names) 
VALUES ('博士研究生配额池规则', '为博士研究生分配研究配额池', 8, ARRAY['phd_research', 'phd_computing']);

-- 添加条件：必须是学生
INSERT INTO auto_quota_pool_conditions (rule_id, condition_type, field_name, operator, field_value, sort_order)
SELECT 
    r.id,
    'field',
    'identity_type',
    'equals',
    'Student',
    1
FROM auto_quota_pool_rules r 
WHERE r.rule_name = '博士研究生配额池规则';

-- 添加条件：必须是博士
INSERT INTO auto_quota_pool_conditions (rule_id, condition_type, field_name, operator, field_value, sort_order)
SELECT 
    r.id,
    'field',
    'student_category_detail',
    'equals',
    'Ph.D.',
    2
FROM auto_quota_pool_rules r 
WHERE r.rule_name = '博士研究生配额池规则';

-- 添加条件：必须是在校状态
INSERT INTO auto_quota_pool_conditions (rule_id, condition_type, field_name, operator, field_value, sort_order)
SELECT 
    r.id,
    'field',
    'school_status',
    'equals',
    'In-School',
    3
FROM auto_quota_pool_rules r 
WHERE r.rule_name = '博士研究生配额池规则';

-- =============================================
-- 4. 复杂OR/AND组合示例
-- =============================================

-- 创建复杂规则：高级用户配额池（教职员 OR 博士研究生）
INSERT INTO auto_quota_pool_rules (rule_name, description, priority, quota_pool_names) 
VALUES ('高级用户配额池规则', '为教职员或博士研究生分配高级配额池', 3, ARRAY['premium_computing', 'premium_research']);

-- 创建顶层OR组
INSERT INTO auto_quota_pool_conditions (rule_id, condition_type, logical_operator, sort_order)
SELECT 
    r.id,
    'group',
    'OR',
    1
FROM auto_quota_pool_rules r 
WHERE r.rule_name = '高级用户配额池规则';

-- 获取顶层OR组的ID
DO $$
DECLARE
    group_id BIGINT;
    rule_id_val BIGINT;
BEGIN
    SELECT id INTO rule_id_val FROM auto_quota_pool_rules WHERE rule_name = '高级用户配额池规则';
    SELECT id INTO group_id FROM auto_quota_pool_conditions WHERE rule_id = rule_id_val AND condition_type = 'group';
    
    -- 教职员条件组
    INSERT INTO auto_quota_pool_conditions (rule_id, parent_condition_id, condition_type, logical_operator, field_name, operator, field_value, sort_order)
    VALUES (rule_id_val, group_id, 'field', 'AND', 'identity_type', 'in', NULL, 1);
    
    -- 更新教职员条件的具体值
    UPDATE auto_quota_pool_conditions 
    SET field_values = ARRAY['Fulltime', 'Parttime']
    WHERE rule_id = rule_id_val AND parent_condition_id = group_id AND field_name = 'identity_type';
    
    -- 博士研究生条件组
    INSERT INTO auto_quota_pool_conditions (rule_id, parent_condition_id, condition_type, logical_operator, field_name, operator, field_value, sort_order)
    VALUES (rule_id_val, group_id, 'field', 'AND', 'student_category_detail', 'equals', 'Ph.D.', 2);
END $$;

-- =============================================
-- 5. 统计查询示例
-- =============================================

-- 统计每个配额池的用户数量
SELECT 
    quota_pool_name,
    COUNT(*) as user_count,
    COUNT(DISTINCT user_upn) as unique_users
FROM auto_quota_pool_mappings m
JOIN auto_quota_pool_rules r ON m.rule_id = r.id
WHERE r.enabled = true
GROUP BY quota_pool_name
ORDER BY user_count DESC;

-- 统计每个规则匹配的用户数量
SELECT 
    r.rule_name,
    r.description,
    COUNT(DISTINCT m.user_upn) as matched_users,
    COUNT(m.id) as total_mappings
FROM auto_quota_pool_rules r
LEFT JOIN auto_quota_pool_mappings m ON r.id = m.rule_id
WHERE r.enabled = true
GROUP BY r.id, r.rule_name, r.description
ORDER BY matched_users DESC;

-- 统计用户身份类型的配额池分布
SELECT 
    u.identity_type,
    u.school_status,
    COUNT(DISTINCT m.quota_pool_name) as quota_pool_count,
    COUNT(m.id) as total_mappings
FROM userinfos_user_infos u
LEFT JOIN auto_quota_pool_mappings m ON u.upn = m.user_upn
LEFT JOIN auto_quota_pool_rules r ON m.rule_id = r.id AND r.enabled = true
GROUP BY u.identity_type, u.school_status
ORDER BY u.identity_type, u.school_status;

-- =============================================
-- 6. 性能优化查询示例
-- =============================================

-- 使用索引优化的用户查询
EXPLAIN (ANALYZE, BUFFERS) 
SELECT * FROM get_user_quota_pools('student001@link.cuhk.edu.cn');

-- 使用索引优化的配额池查询
EXPLAIN (ANALYZE, BUFFERS) 
SELECT * FROM get_quota_pool_users('student_basic');

-- 复杂条件查询的性能分析
EXPLAIN (ANALYZE, BUFFERS)
SELECT DISTINCT m.quota_pool_name
FROM auto_quota_pool_mappings m
JOIN auto_quota_pool_rules r ON m.rule_id = r.id
JOIN userinfos_user_infos u ON m.user_upn = u.upn
WHERE u.identity_type = 'Student'
  AND u.school_status = 'In-School'
  AND r.enabled = true;

-- =============================================
-- 7. 维护操作示例
-- =============================================

-- 禁用某个规则
UPDATE auto_quota_pool_rules 
SET enabled = false, updated_at = NOW()
WHERE rule_name = '学生配额池规则';

-- 更新规则优先级
UPDATE auto_quota_pool_rules 
SET priority = 1, updated_at = NOW()
WHERE rule_name = '高级用户配额池规则';

-- 清理无效映射（用户不存在）
DELETE FROM auto_quota_pool_mappings 
WHERE user_upn NOT IN (SELECT upn FROM userinfos_user_infos);

-- 清理无效映射（规则被禁用）
DELETE FROM auto_quota_pool_mappings 
WHERE rule_id IN (SELECT id FROM auto_quota_pool_rules WHERE enabled = false);

-- 重新评估所有规则（简化版本）
SELECT * FROM reevaluate_all_rules();

-- 重新评估单个规则
SELECT * FROM reevaluate_rule_simple(1);

-- 预览规则匹配结果（测试用）
SELECT * FROM preview_rule_matches(1, 5);
