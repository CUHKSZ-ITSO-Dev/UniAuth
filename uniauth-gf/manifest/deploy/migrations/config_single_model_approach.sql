CREATE TABLE config_single_model_approach (
    approach_name VARCHAR(255) PRIMARY KEY,
    pricing JSONB,
    discount NUMERIC(25, 10),
    client_type VARCHAR(255),
    client_args JSONB,
    request_args JSONB,
    servicewares VARCHAR(255)[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- 索引
CREATE INDEX idx_config_single_model_approach_approach_name ON config_single_model_approach(approach_name);
CREATE INDEX idx_config_single_model_approach_client_type ON config_single_model_approach(client_type);
CREATE INDEX idx_config_single_model_approach_servicewares ON config_single_model_approach(servicewares);

-- 注释
COMMENT ON TABLE config_single_model_approach IS '模型配置：包含模型名称、定价、折扣、客户端/请求参数与服务项';
COMMENT ON COLUMN config_single_model_approach.approach_name IS '模型名称';
COMMENT ON COLUMN config_single_model_approach.pricing IS '定价配置（JSON）';
COMMENT ON COLUMN config_single_model_approach.discount IS '折扣';
COMMENT ON COLUMN config_single_model_approach.client_type IS '客户端类型';
COMMENT ON COLUMN config_single_model_approach.client_args IS '客户端参数（JSON）';
COMMENT ON COLUMN config_single_model_approach.request_args IS '请求参数（JSON）';
COMMENT ON COLUMN config_single_model_approach.servicewares IS '服务项标识';
COMMENT ON COLUMN config_single_model_approach.created_at IS '创建时间';
COMMENT ON COLUMN config_single_model_approach.updated_at IS '更新时间';