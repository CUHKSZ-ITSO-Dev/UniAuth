CREATE TABLE billing_cost_records (
    id BIGSERIAL PRIMARY KEY,
    upn VARCHAR(255) NOT NULL,
    svc VARCHAR(255) NOT NULL,
    product VARCHAR(255) NOT NULL,
    cost DECIMAL(15, 10) NOT NULL,
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

