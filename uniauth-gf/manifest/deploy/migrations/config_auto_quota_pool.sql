CREATE TABLE config_auto_quota_pool (
    id BIGSERIAL PRIMARY KEY,
    rule_name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    cron_cycle VARCHAR(255) NOT NULL,
    regular_quota NUMERIC(25, 10) NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    filter_group JSONB NULL,
    upns_cache JSONB NULL,
    priority INTEGER NOT NULL DEFAULT 100,
    last_evaluated_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 规则表索引
CREATE INDEX idx_config_auto_quota_pool_enabled ON config_auto_quota_pool(enabled);
CREATE INDEX idx_config_auto_quota_pool_priority ON config_auto_quota_pool(priority);
CREATE INDEX idx_config_auto_quota_pool_upns_cache ON config_auto_quota_pool USING GIN (upns_cache);

-- 规则表注释
COMMENT ON TABLE config_auto_quota_pool IS '自动配额池规则：定义规则基本信息和目标配额池';
COMMENT ON COLUMN config_auto_quota_pool.id IS '自增主键';
COMMENT ON COLUMN config_auto_quota_pool.rule_name IS '规则名称，唯一';
COMMENT ON COLUMN config_auto_quota_pool.description IS '规则说明';
COMMENT ON COLUMN config_auto_quota_pool.cron_cycle IS '刷新周期';
COMMENT ON COLUMN config_auto_quota_pool.regular_quota IS '定期配额';
COMMENT ON COLUMN config_auto_quota_pool.enabled IS '是否启用该配额池';
COMMENT ON COLUMN config_auto_quota_pool.filter_group IS '过滤条件组';
COMMENT ON COLUMN config_auto_quota_pool.upns_cache IS 'UPN缓存列表';
COMMENT ON COLUMN config_auto_quota_pool.priority IS '优先级，数值越小优先匹配';
COMMENT ON COLUMN config_auto_quota_pool.last_evaluated_at IS '该规则上次评估时间';
COMMENT ON COLUMN config_auto_quota_pool.created_at IS '创建时间';
COMMENT ON COLUMN config_auto_quota_pool.updated_at IS '更新时间';
