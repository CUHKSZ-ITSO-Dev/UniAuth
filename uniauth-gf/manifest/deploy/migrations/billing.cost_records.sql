CREATE SCHEMA IF NOT EXISTS billing;

CREATE TABLE billing.cost_records (
    id BIGSERIAL PRIMARY KEY,
    upn VARCHAR(255),
    service VARCHAR(255),
    product VARCHAR(255),
    cost DECIMAL(15, 4),
    tokens JSONB,
    plan VARCHAR(255),
    source VARCHAR(255),
    remark JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    delete_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_billing_cost_records_upn ON billing.cost_records(upn);
CREATE INDEX idx_billing_cost_records_service ON billing.cost_records(service);
CREATE INDEX idx_billing_cost_records_service_and_product ON billing.cost_records(service, product);
CREATE INDEX idx_billing_cost_records_source ON billing.cost_records(source);
