-- 自动配额池条件表
CREATE TABLE auto_quota_pool_conditions (
    id BIGSERIAL PRIMARY KEY,
    rule_id BIGINT NOT NULL REFERENCES auto_quota_pool_rules(id) ON DELETE CASCADE,
    parent_condition_id BIGINT REFERENCES auto_quota_pool_conditions(id) ON DELETE CASCADE,
    condition_type VARCHAR(20) NOT NULL CHECK (condition_type IN ('field', 'group')),
    logical_operator VARCHAR(10) NOT NULL DEFAULT 'AND' CHECK (logical_operator IN ('AND', 'OR')),
    field_name VARCHAR(100), -- 字段名，如 'school_status', 'identity_type' 等
    operator VARCHAR(20), -- 操作符：'equals', 'in', 'not_in', 'contains', 'regex' 等
    field_value TEXT, -- 单个值
    field_values TEXT[], -- 多个值（数组）
    sort_order INTEGER NOT NULL DEFAULT 0, -- 条件排序
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 条件表索引
CREATE INDEX idx_auto_quota_pool_conditions_rule_id ON auto_quota_pool_conditions(rule_id);
CREATE INDEX idx_auto_quota_pool_conditions_parent ON auto_quota_pool_conditions(parent_condition_id);
CREATE INDEX idx_auto_quota_pool_conditions_type ON auto_quota_pool_conditions(condition_type);
CREATE INDEX idx_auto_quota_pool_conditions_field ON auto_quota_pool_conditions(field_name);
CREATE INDEX idx_auto_quota_pool_conditions_sort ON auto_quota_pool_conditions(rule_id, sort_order);

-- 条件表注释
COMMENT ON TABLE auto_quota_pool_conditions IS '自动配额池条件：支持复杂逻辑组合';
COMMENT ON COLUMN auto_quota_pool_conditions.id IS '自增主键';
COMMENT ON COLUMN auto_quota_pool_conditions.rule_id IS '关联的规则ID';
COMMENT ON COLUMN auto_quota_pool_conditions.parent_condition_id IS '父条件ID，用于构建条件树';
COMMENT ON COLUMN auto_quota_pool_conditions.condition_type IS '条件类型：field=字段条件，group=逻辑组合';
COMMENT ON COLUMN auto_quota_pool_conditions.logical_operator IS '逻辑操作符：AND/OR';
COMMENT ON COLUMN auto_quota_pool_conditions.field_name IS '匹配的字段名';
COMMENT ON COLUMN auto_quota_pool_conditions.operator IS '操作符：equals/in/not_in/contains/regex等';
COMMENT ON COLUMN auto_quota_pool_conditions.field_value IS '单个字段值';
COMMENT ON COLUMN auto_quota_pool_conditions.field_values IS '多个字段值（数组）';
COMMENT ON COLUMN auto_quota_pool_conditions.sort_order IS '条件排序，用于确定执行顺序';
COMMENT ON COLUMN auto_quota_pool_conditions.created_at IS '创建时间';
