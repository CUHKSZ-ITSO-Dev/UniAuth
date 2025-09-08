CREATE TABLE quotapool_quota_pool (
    id BIGSERIAL PRIMARY KEY,

    quota_pool_name VARCHAR(255) NOT NULL UNIQUE, -- 配额池名称
    cron_cycle VARCHAR(255) NOT NULL, -- 刷新周期
    regular_quota NUMERIC(25, 10) NOT NULL, -- 定期配额
    remaining_quota NUMERIC(25, 10) NOT NULL, -- 剩余配额
    last_reset_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(), -- 上次刷新时间
    extra_quota NUMERIC(25, 10) NOT NULL DEFAULT 0, -- 加油包
    personal BOOLEAN NOT NULL, -- 是否个人配额池
    disabled BOOLEAN NOT NULL, -- 是否禁用

    userinfos_rules JSONB, -- 用户信息规则

    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
