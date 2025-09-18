-- 创建视图：用户配额池映射详情
CREATE VIEW v_user_quota_pool_mappings AS
SELECT 
    m.user_upn,
    u.display_name,
    u.department,
    u.identity_type,
    m.quota_pool_name,
    r.rule_name,
    r.description as rule_description,
    m.matched_at,
    m.created_at
FROM auto_quota_pool_mappings m
JOIN userinfos_user_infos u ON m.user_upn = u.upn
JOIN auto_quota_pool_rules r ON m.rule_id = r.id
WHERE r.enabled = true;

-- 创建视图：配额池用户详情
CREATE VIEW v_quota_pool_users AS
SELECT 
    m.quota_pool_name,
    m.user_upn,
    u.display_name,
    u.department,
    u.identity_type,
    u.school_status,
    u.title,
    r.rule_name,
    m.matched_at
FROM auto_quota_pool_mappings m
JOIN userinfos_user_infos u ON m.user_upn = u.upn
JOIN auto_quota_pool_rules r ON m.rule_id = r.id
WHERE r.enabled = true;

-- 创建函数：根据用户查询匹配的配额池
CREATE OR REPLACE FUNCTION get_user_quota_pools(p_user_upn VARCHAR(255))
RETURNS TABLE(
    quota_pool_name VARCHAR(255),
    rule_name VARCHAR(255),
    matched_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.quota_pool_name,
        r.rule_name,
        m.matched_at
    FROM auto_quota_pool_mappings m
    JOIN auto_quota_pool_rules r ON m.rule_id = r.id
    WHERE m.user_upn = p_user_upn 
    AND r.enabled = true
    ORDER BY r.priority, m.matched_at DESC;
END;
$$ LANGUAGE plpgsql;

-- 创建函数：根据配额池查询匹配的用户
CREATE OR REPLACE FUNCTION get_quota_pool_users(p_quota_pool_name VARCHAR(255))
RETURNS TABLE(
    user_upn VARCHAR(255),
    display_name VARCHAR(255),
    department VARCHAR(255),
    identity_type VARCHAR(255),
    rule_name VARCHAR(255),
    matched_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.user_upn,
        u.display_name,
        u.department,
        u.identity_type,
        r.rule_name,
        m.matched_at
    FROM auto_quota_pool_mappings m
    JOIN userinfos_user_infos u ON m.user_upn = u.upn
    JOIN auto_quota_pool_rules r ON m.rule_id = r.id
    WHERE m.quota_pool_name = p_quota_pool_name 
    AND r.enabled = true
    ORDER BY r.priority, m.matched_at DESC;
END;
$$ LANGUAGE plpgsql;

-- 辅助函数：构建单个字段条件
CREATE OR REPLACE FUNCTION build_field_condition(
    p_field_name VARCHAR(100),
    p_operator VARCHAR(20),
    p_field_value TEXT,
    p_field_values TEXT[]
) RETURNS TEXT AS $$
DECLARE
    condition TEXT := '';
    quoted_values TEXT;
BEGIN
    -- 验证字段名（防止SQL注入）
    IF p_field_name NOT IN (
        'upn', 'email', 'display_name', 'school_status', 'identity_type', 
        'employee_id', 'name', 'tags', 'department', 'title', 'office', 
        'office_phone', 'employee_type', 'funding_type_or_admission_year',
        'student_category_primary', 'student_category_detail', 
        'student_nationality_type', 'residential_college', 'staff_role',
        'sam_account_name', 'mail_nickname'
    ) THEN
        RAISE EXCEPTION 'Invalid field name: %', p_field_name;
    END IF;
    
    CASE p_operator
        WHEN 'equals' THEN
            condition := p_field_name || ' = ' || quote_literal(p_field_value);
        WHEN 'not_equals' THEN
            condition := p_field_name || ' != ' || quote_literal(p_field_value);
        WHEN 'in' THEN
            IF p_field_values IS NOT NULL AND array_length(p_field_values, 1) > 0 THEN
                quoted_values := array_to_string(
                    ARRAY(SELECT quote_literal(val) FROM unnest(p_field_values) AS val), 
                    ','
                );
                condition := p_field_name || ' = ANY(ARRAY[' || quoted_values || '])';
            END IF;
        WHEN 'not_in' THEN
            IF p_field_values IS NOT NULL AND array_length(p_field_values, 1) > 0 THEN
                quoted_values := array_to_string(
                    ARRAY(SELECT quote_literal(val) FROM unnest(p_field_values) AS val), 
                    ','
                );
                condition := p_field_name || ' != ALL(ARRAY[' || quoted_values || '])';
            END IF;
        WHEN 'contains' THEN
            condition := p_field_name || ' ILIKE ' || quote_literal('%' || p_field_value || '%');
        WHEN 'not_contains' THEN
            condition := p_field_name || ' NOT ILIKE ' || quote_literal('%' || p_field_value || '%');
        WHEN 'starts_with' THEN
            condition := p_field_name || ' ILIKE ' || quote_literal(p_field_value || '%');
        WHEN 'ends_with' THEN
            condition := p_field_name || ' ILIKE ' || quote_literal('%' || p_field_value);
        WHEN 'is_null' THEN
            condition := p_field_name || ' IS NULL';
        WHEN 'is_not_null' THEN
            condition := p_field_name || ' IS NOT NULL';
        WHEN 'regex' THEN
            condition := p_field_name || ' ~ ' || quote_literal(p_field_value);
        WHEN 'array_contains' THEN
            -- 用于数组字段（如tags）的包含查询
            IF p_field_values IS NOT NULL AND array_length(p_field_values, 1) > 0 THEN
                quoted_values := array_to_string(
                    ARRAY(SELECT quote_literal(val) FROM unnest(p_field_values) AS val), 
                    ','
                );
                condition := p_field_name || ' && ARRAY[' || quoted_values || ']';
            END IF;
        ELSE
            RAISE EXCEPTION 'Unsupported operator: %', p_operator;
    END CASE;
    
    RETURN condition;
END;
$$ LANGUAGE plpgsql;

-- 辅助函数：递归构建条件树
CREATE OR REPLACE FUNCTION build_condition_tree(p_rule_id BIGINT, p_parent_id BIGINT DEFAULT NULL)
RETURNS TEXT AS $$
DECLARE
    condition_record RECORD;
    child_conditions TEXT[] := '{}';
    result TEXT := '';
    group_conditions TEXT[] := '{}';
    i INTEGER;
BEGIN
    -- 获取当前层级的所有条件
    FOR condition_record IN 
        SELECT * FROM auto_quota_pool_conditions 
        WHERE rule_id = p_rule_id 
        AND (p_parent_id IS NULL AND parent_condition_id IS NULL 
             OR parent_condition_id = p_parent_id)
        ORDER BY sort_order
    LOOP
        IF condition_record.condition_type = 'field' THEN
            -- 字段条件
            DECLARE
                field_condition TEXT;
            BEGIN
                field_condition := build_field_condition(
                    condition_record.field_name,
                    condition_record.operator,
                    condition_record.field_value,
                    condition_record.field_values
                );
                
                IF field_condition != '' THEN
                    child_conditions := array_append(child_conditions, field_condition);
                END IF;
            END;
        ELSIF condition_record.condition_type = 'group' THEN
            -- 逻辑组合条件，递归处理
            DECLARE
                group_condition TEXT;
            BEGIN
                group_condition := build_condition_tree(p_rule_id, condition_record.id);
                
                IF group_condition != '' THEN
                    -- 如果组内有多个条件，需要用括号包围
                    IF position(' AND ' in group_condition) > 0 OR position(' OR ' in group_condition) > 0 THEN
                        group_condition := '(' || group_condition || ')';
                    END IF;
                    child_conditions := array_append(child_conditions, group_condition);
                END IF;
            END;
        END IF;
    END LOOP;
    
    -- 根据逻辑操作符组合条件
    IF array_length(child_conditions, 1) > 0 THEN
        IF array_length(child_conditions, 1) = 1 THEN
            result := child_conditions[1];
        ELSE
            -- 获取当前组的逻辑操作符
            SELECT logical_operator INTO condition_record.logical_operator
            FROM auto_quota_pool_conditions 
            WHERE rule_id = p_rule_id 
            AND id = p_parent_id
            AND condition_type = 'group';
            
            IF condition_record.logical_operator IS NULL THEN
                condition_record.logical_operator := 'AND';
            END IF;
            
            -- 用逻辑操作符连接所有条件
            result := array_to_string(child_conditions, ' ' || condition_record.logical_operator || ' ');
        END IF;
    END IF;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 主函数：重新评估所有规则
CREATE OR REPLACE FUNCTION reevaluate_all_rules()
RETURNS TABLE(
    result_rule_id BIGINT,
    rule_name VARCHAR(255),
    matched_users INTEGER,
    execution_time_ms INTEGER
) AS $$
DECLARE
    rule_record RECORD;
    condition_sql TEXT;
    full_sql TEXT;
    user_record RECORD;
    matched_count INTEGER := 0;
    start_time TIMESTAMP;
    end_time TIMESTAMP;
    execution_time INTEGER;
    total_matched INTEGER := 0;
    pool_name TEXT;
BEGIN
    -- 清空现有映射
    DELETE FROM auto_quota_pool_mappings;
    
    -- 遍历所有启用的规则，按优先级排序
    FOR rule_record IN 
        SELECT * FROM auto_quota_pool_rules 
        WHERE enabled = true 
        ORDER BY priority, id
    LOOP
        start_time := clock_timestamp();
        matched_count := 0;
        
        -- 构建该规则的条件SQL
        condition_sql := build_condition_tree(rule_record.id);
        
        -- 如果条件为空，跳过该规则
        IF condition_sql IS NULL OR condition_sql = '' THEN
            RAISE NOTICE 'Rule % has no valid conditions, skipping', rule_record.rule_name;
            CONTINUE;
        END IF;
        
        -- 构建完整的查询SQL
        full_sql := 'SELECT upn FROM userinfos_user_infos WHERE ' || condition_sql;
        
        -- 执行查询并创建映射
        BEGIN
            FOR user_record IN EXECUTE full_sql
            LOOP
                -- 为每个配额池创建映射
                DECLARE
                    current_rule_id BIGINT := rule_record.id;
                BEGIN
                    FOREACH pool_name IN ARRAY rule_record.quota_pool_names
                    LOOP
                        INSERT INTO auto_quota_pool_mappings (user_upn, quota_pool_name, rule_id)
                        VALUES (user_record.upn, pool_name, current_rule_id)
                        ON CONFLICT (user_upn, quota_pool_name, rule_id) DO NOTHING;
                    END LOOP;
                END;
                
                matched_count := matched_count + 1;
            END LOOP;
            
            -- 更新规则评估时间
            UPDATE auto_quota_pool_rules 
            SET last_evaluated_at = NOW(), updated_at = NOW()
            WHERE id = rule_record.id;
            
        EXCEPTION
            WHEN OTHERS THEN
                RAISE WARNING 'Error evaluating rule %: %', rule_record.rule_name, SQLERRM;
                CONTINUE;
        END;
        
        end_time := clock_timestamp();
        execution_time := EXTRACT(MILLISECONDS FROM (end_time - start_time))::INTEGER;
        total_matched := total_matched + matched_count;
        
        -- 返回该规则的执行结果
        result_rule_id := rule_record.id;
        rule_name := rule_record.rule_name;
        matched_users := matched_count;
        execution_time_ms := execution_time;
        RETURN NEXT;
        
        RAISE NOTICE 'Rule %: matched % users in % ms', rule_record.rule_name, matched_count, execution_time;
    END LOOP;
    
    RAISE NOTICE 'Total reevaluation completed: % users matched across all rules', total_matched;
END;
$$ LANGUAGE plpgsql;
