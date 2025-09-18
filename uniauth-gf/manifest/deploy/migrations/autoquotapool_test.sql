-- =============================================
-- 自动配额池配置系统 - 测试脚本
-- =============================================

-- 1. 插入测试规则和条件
-- 规则1：学生配额池规则
INSERT INTO auto_quota_pool_rules (rule_name, description, priority, quota_pool_names) 
VALUES ('学生配额池规则', '为在校学生分配基础配额池', 10, ARRAY['student_basic', 'student_research']);

-- 获取规则ID
DO $$
DECLARE
    student_rule_id BIGINT;
    faculty_rule_id BIGINT;
    complex_rule_id BIGINT;
BEGIN
    -- 获取学生规则ID
    SELECT id INTO student_rule_id FROM auto_quota_pool_rules WHERE rule_name = '学生配额池规则';
    
    -- 学生规则条件：必须是学生
    INSERT INTO auto_quota_pool_conditions (rule_id, condition_type, field_name, operator, field_value, sort_order)
    VALUES (student_rule_id, 'field', 'identity_type', 'equals', 'Student', 1);
    
    -- 学生规则条件：必须是在校状态
    INSERT INTO auto_quota_pool_conditions (rule_id, condition_type, field_name, operator, field_value, sort_order)
    VALUES (student_rule_id, 'field', 'school_status', 'in', NULL, 2);
    
    -- 更新在校状态条件的具体值
    UPDATE auto_quota_pool_conditions 
    SET field_values = ARRAY['In-School', 'Employed']
    WHERE rule_id = student_rule_id AND field_name = 'school_status' AND operator = 'in';
    
    -- 规则2：教职员配额池规则
    INSERT INTO auto_quota_pool_rules (rule_name, description, priority, quota_pool_names) 
    VALUES ('教职员配额池规则', '为教职员分配高级配额池', 5, ARRAY['faculty_premium', 'faculty_research']);
    
    SELECT id INTO faculty_rule_id FROM auto_quota_pool_rules WHERE rule_name = '教职员配额池规则';
    
    -- 教职员规则条件：必须是教职员身份
    INSERT INTO auto_quota_pool_conditions (rule_id, condition_type, field_name, operator, field_value, sort_order)
    VALUES (faculty_rule_id, 'field', 'identity_type', 'in', NULL, 1);
    
    -- 更新教职员身份条件的具体值
    UPDATE auto_quota_pool_conditions 
    SET field_values = ARRAY['Fulltime', 'Parttime']
    WHERE rule_id = faculty_rule_id AND field_name = 'identity_type' AND operator = 'in';
    
    -- 规则3：复杂OR/AND组合规则
    INSERT INTO auto_quota_pool_rules (rule_name, description, priority, quota_pool_names) 
    VALUES ('高级用户配额池规则', '为教职员或博士研究生分配高级配额池', 3, ARRAY['premium_computing', 'premium_research']);
    
    SELECT id INTO complex_rule_id FROM auto_quota_pool_rules WHERE rule_name = '高级用户配额池规则';
    
    -- 创建顶层OR组
    INSERT INTO auto_quota_pool_conditions (rule_id, condition_type, logical_operator, sort_order)
    VALUES (complex_rule_id, 'group', 'OR', 1);
    
    -- 获取顶层OR组的ID
    DECLARE
        group_id BIGINT;
    BEGIN
        SELECT id INTO group_id FROM auto_quota_pool_conditions 
        WHERE rule_id = complex_rule_id AND condition_type = 'group';
        
        -- 教职员条件组
        INSERT INTO auto_quota_pool_conditions (rule_id, parent_condition_id, condition_type, logical_operator, field_name, operator, field_value, sort_order)
        VALUES (complex_rule_id, group_id, 'field', 'AND', 'identity_type', 'in', NULL, 1);
        
        -- 更新教职员条件的具体值
        UPDATE auto_quota_pool_conditions 
        SET field_values = ARRAY['Fulltime', 'Parttime']
        WHERE rule_id = complex_rule_id AND parent_condition_id = group_id AND field_name = 'identity_type';
        
        -- 博士研究生条件组
        INSERT INTO auto_quota_pool_conditions (rule_id, parent_condition_id, condition_type, logical_operator, field_name, operator, field_value, sort_order)
        VALUES (complex_rule_id, group_id, 'field', 'AND', 'student_category_detail', 'equals', 'Ph.D.', 2);
    END;
END $$;

-- 2. 测试条件构建函数
-- 测试单个字段条件构建
SELECT 'Testing build_field_condition function:' as test_name;

SELECT build_field_condition('identity_type', 'equals', 'Student', NULL) as equals_test;
SELECT build_field_condition('school_status', 'in', NULL, ARRAY['In-School', 'Employed']) as in_test;
SELECT build_field_condition('department', 'contains', '计算机', NULL) as contains_test;
SELECT build_field_condition('tags', 'array_contains', NULL, ARRAY['research', 'phd']) as array_contains_test;

-- 3. 测试条件树构建函数
SELECT 'Testing build_condition_tree function:' as test_name;

-- 测试学生规则的条件树
SELECT build_condition_tree(
    (SELECT id FROM auto_quota_pool_rules WHERE rule_name = '学生配额池规则')
) as student_rule_conditions;

-- 测试教职员规则的条件树
SELECT build_condition_tree(
    (SELECT id FROM auto_quota_pool_rules WHERE rule_name = '教职员配额池规则')
) as faculty_rule_conditions;

-- 测试复杂规则的条件树
SELECT build_condition_tree(
    (SELECT id FROM auto_quota_pool_rules WHERE rule_name = '高级用户配额池规则')
) as complex_rule_conditions;

-- 4. 插入测试用户数据（如果不存在）
INSERT INTO userinfos_user_infos (upn, display_name, identity_type, school_status, student_category_detail, department, tags)
VALUES 
    ('student001@link.cuhk.edu.cn', '张三', 'Student', 'In-School', 'Master', '计算机科学与工程系', ARRAY['research', 'ai']),
    ('student002@link.cuhk.edu.cn', '李四', 'Student', 'In-School', 'Ph.D.', '电子工程系', ARRAY['research', 'phd']),
    ('faculty001@cuhk.edu.cn', '王教授', 'Fulltime', 'Employed', NULL, '计算机科学与工程系', ARRAY['faculty', 'ai']),
    ('faculty002@cuhk.edu.cn', '李教授', 'Parttime', 'Employed', NULL, '电子工程系', ARRAY['faculty', 'research']),
    ('student003@link.cuhk.edu.cn', '赵五', 'Student', 'Graduation', 'Master', '数学系', ARRAY['graduated'])
ON CONFLICT (upn) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    identity_type = EXCLUDED.identity_type,
    school_status = EXCLUDED.school_status,
    student_category_detail = EXCLUDED.student_category_detail,
    department = EXCLUDED.department,
    tags = EXCLUDED.tags;

-- 5. 执行规则重新评估
SELECT 'Executing reevaluate_all_rules function:' as test_name;

-- 执行重新评估并查看结果
SELECT * FROM reevaluate_all_rules();

-- 6. 验证映射结果
SELECT 'Verifying mapping results:' as test_name;

-- 查看所有映射
SELECT 
    m.user_upn,
    u.display_name,
    u.identity_type,
    u.school_status,
    m.quota_pool_name,
    r.rule_name,
    m.matched_at
FROM auto_quota_pool_mappings m
JOIN userinfos_user_infos u ON m.user_upn = u.upn
JOIN auto_quota_pool_rules r ON m.rule_id = r.id
ORDER BY m.user_upn, m.quota_pool_name;

-- 7. 测试查询函数
SELECT 'Testing query functions:' as test_name;

-- 测试根据用户查询配额池
SELECT * FROM get_user_quota_pools('student001@link.cuhk.edu.cn');
SELECT * FROM get_user_quota_pools('faculty001@cuhk.edu.cn');

-- 测试根据配额池查询用户
SELECT * FROM get_quota_pool_users('student_basic');
SELECT * FROM get_quota_pool_users('faculty_premium');

-- 8. 性能测试
SELECT 'Performance testing:' as test_name;

-- 测试条件构建性能
EXPLAIN (ANALYZE, BUFFERS) 
SELECT build_condition_tree(id) 
FROM auto_quota_pool_rules 
WHERE enabled = true;

-- 测试映射查询性能
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM get_user_quota_pools('student001@link.cuhk.edu.cn');

-- 9. 清理测试数据（可选）
-- 取消注释以下行来清理测试数据
/*
DELETE FROM auto_quota_pool_mappings;
DELETE FROM auto_quota_pool_conditions;
DELETE FROM auto_quota_pool_rules;
DELETE FROM userinfos_user_infos WHERE upn LIKE '%@link.cuhk.edu.cn' OR upn LIKE '%@cuhk.edu.cn';
*/
