CREATE TABLE billing_cost_records (
    id BIGSERIAL PRIMARY KEY,
    upn VARCHAR(255) NOT NULL,
    svc VARCHAR(255) NOT NULL,
    product VARCHAR(255) NOT NULL,
    cost NUMERIC(25, 10) NOT NULL,
    original_cost NUMERIC(25, 10) NOT NULL,
    plan VARCHAR(255) NOT NULL,
    source VARCHAR(255) NOT NULL,
    remark JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_billing_cost_records_upn ON billing_cost_records(upn);
CREATE INDEX idx_billing_cost_records_svc ON billing_cost_records(svc);
CREATE INDEX idx_billing_cost_records_svc_and_product ON billing_cost_records(svc, product);
CREATE INDEX idx_billing_cost_records_source ON billing_cost_records(source);
CREATE INDEX idx_billing_cost_records_created_at ON billing_cost_records(created_at);

COMMENT ON COLUMN billing_cost_records.id IS '自增主键';
COMMENT ON COLUMN billing_cost_records.upn IS 'UPN';
COMMENT ON COLUMN billing_cost_records.svc IS '服务名称';
COMMENT ON COLUMN billing_cost_records.product IS '产品名称';
COMMENT ON COLUMN billing_cost_records.cost IS '费用';
COMMENT ON COLUMN billing_cost_records.original_cost IS '原始费用';
COMMENT ON COLUMN billing_cost_records.plan IS '计费方案';
COMMENT ON COLUMN billing_cost_records.source IS '来源';
COMMENT ON COLUMN billing_cost_records.remark IS '备注信息';
COMMENT ON COLUMN billing_cost_records.created_at IS '创建时间';