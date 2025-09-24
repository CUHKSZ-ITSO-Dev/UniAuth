CREATE TABLE quotapool_quota_pool (
    quota_pool_name VARCHAR(255) NOT NULL PRIMARY KEY,
    cron_cycle VARCHAR(255) NOT NULL,
    regular_quota NUMERIC(25, 10) NOT NULL,
    remaining_quota NUMERIC(25, 10) NOT NULL,
    last_reset_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    extra_quota NUMERIC(25, 10) NOT NULL DEFAULT 0,
    personal BOOLEAN NOT NULL,
    disabled BOOLEAN NOT NULL,
    userinfos_rules JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_quotapool_quota_pool_quota_pool_name ON quotapool_quota_pool(quota_pool_name);

COMMENT ON COLUMN quotapool_quota_pool.quota_pool_name IS '配额池名称';
COMMENT ON COLUMN quotapool_quota_pool.cron_cycle IS '刷新周期';
COMMENT ON COLUMN quotapool_quota_pool.regular_quota IS '定期配额';
COMMENT ON COLUMN quotapool_quota_pool.remaining_quota IS '剩余配额';
COMMENT ON COLUMN quotapool_quota_pool.last_reset_at IS '上次刷新时间';
COMMENT ON COLUMN quotapool_quota_pool.extra_quota IS '加油包';
COMMENT ON COLUMN quotapool_quota_pool.personal IS '是否个人配额池';
COMMENT ON COLUMN quotapool_quota_pool.disabled IS '是否禁用';
COMMENT ON COLUMN quotapool_quota_pool.userinfos_rules IS 'ITTools规则';
COMMENT ON COLUMN quotapool_quota_pool.created_at IS '创建时间';
COMMENT ON COLUMN quotapool_quota_pool.updated_at IS '修改时间';