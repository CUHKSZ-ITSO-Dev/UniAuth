CREATE SCHEMA IF NOT EXISTS config;

CREATE TABLE config.models (
    model_name VARCHAR(255) PRIMARY KEY ,
    description text,
    tokens_price JSONB,
    discount DECIMAL(15, 4),
    endpoint text,
    apikey text,
    extra JSONB
);