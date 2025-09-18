-- 用户配额池映射表
CREATE TABLE auto_quota_pool_mappings (
    id BIGSERIAL PRIMARY KEY,
    user_upn VARCHAR(255) NOT NULL REFERENCES userinfos_user_infos(upn) ON DELETE CASCADE,
    quota_pool_name VARCHAR(255) NOT NULL,
    rule_id BIGINT NOT NULL REFERENCES auto_quota_pool_rules(id) ON DELETE CASCADE,
    matched_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(user_upn, quota_pool_name, rule_id) -- 防止重复映射
);

-- 映射表索引
CREATE INDEX idx_auto_quota_pool_mappings_user ON auto_quota_pool_mappings(user_upn);
CREATE INDEX idx_auto_quota_pool_mappings_quota_pool ON auto_quota_pool_mappings(quota_pool_name);
CREATE INDEX idx_auto_quota_pool_mappings_rule ON auto_quota_pool_mappings(rule_id);
CREATE INDEX idx_auto_quota_pool_mappings_matched_at ON auto_quota_pool_mappings(matched_at);

-- 复合索引用于双向查询优化
CREATE INDEX idx_auto_quota_pool_mappings_user_quota ON auto_quota_pool_mappings(user_upn, quota_pool_name);
CREATE INDEX idx_auto_quota_pool_mappings_quota_user ON auto_quota_pool_mappings(quota_pool_name, user_upn);

-- 映射表注释
COMMENT ON TABLE auto_quota_pool_mappings IS '用户配额池映射：存储用户与配额池的实际映射关系';
COMMENT ON COLUMN auto_quota_pool_mappings.id IS '自增主键';
COMMENT ON COLUMN auto_quota_pool_mappings.user_upn IS '用户UPN，关联用户信息表';
COMMENT ON COLUMN auto_quota_pool_mappings.quota_pool_name IS '配额池名称';
COMMENT ON COLUMN auto_quota_pool_mappings.rule_id IS '匹配的规则ID';
COMMENT ON COLUMN auto_quota_pool_mappings.matched_at IS '匹配时间';
COMMENT ON COLUMN auto_quota_pool_mappings.created_at IS '创建时间';
