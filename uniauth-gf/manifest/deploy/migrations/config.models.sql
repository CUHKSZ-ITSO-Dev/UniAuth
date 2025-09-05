CREATE SCHEMA IF NOT EXISTS config;

CREATE TABLE config.models (
    model_name VARCHAR(255) PRIMARY KEY ,
    description text,
    tokens_price JSONB,
    endpoint text,
    apikey text,
    extra JSONB
);