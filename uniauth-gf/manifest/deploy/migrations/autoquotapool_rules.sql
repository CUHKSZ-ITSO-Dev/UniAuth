-- 自动配额池规则表
CREATE TABLE auto_quota_pool_rules (
    id BIGSERIAL PRIMARY KEY,
    rule_name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    priority INTEGER NOT NULL DEFAULT 100,
    quota_pool_names TEXT[] NOT NULL, -- 目标配额池名称数组
    last_evaluated_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 规则表索引
CREATE INDEX idx_auto_quota_pool_rules_enabled ON auto_quota_pool_rules(enabled);
CREATE INDEX idx_auto_quota_pool_rules_priority ON auto_quota_pool_rules(priority);
CREATE INDEX idx_auto_quota_pool_rules_quota_pool_names ON auto_quota_pool_rules USING GIN(quota_pool_names);

-- 规则表注释
COMMENT ON TABLE auto_quota_pool_rules IS '自动配额池规则：定义规则基本信息和目标配额池';
COMMENT ON COLUMN auto_quota_pool_rules.id IS '自增主键';
COMMENT ON COLUMN auto_quota_pool_rules.rule_name IS '规则名称，唯一';
COMMENT ON COLUMN auto_quota_pool_rules.description IS '规则说明';
COMMENT ON COLUMN auto_quota_pool_rules.enabled IS '是否启用该规则';
COMMENT ON COLUMN auto_quota_pool_rules.priority IS '优先级，数值越小优先匹配';
COMMENT ON COLUMN auto_quota_pool_rules.quota_pool_names IS '目标配额池名称集合';
COMMENT ON COLUMN auto_quota_pool_rules.last_evaluated_at IS '该规则上次评估时间';
COMMENT ON COLUMN auto_quota_pool_rules.created_at IS '创建时间';
COMMENT ON COLUMN auto_quota_pool_rules.updated_at IS '更新时间';
