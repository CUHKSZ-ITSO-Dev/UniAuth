CREATE TABLE config_models (
    model_name VARCHAR(255) PRIMARY KEY ,
    description TEXT,
    price JSONB,
    -- 价格信息
    -- {
    --     "input_tokens": "10.98",
    --     "output_tokens": "100.9998",
    --     "currency": "USD"
    -- }
    discount DECIMAL(15, 10),
    endpoint TEXT,
    apikey TEXT,
    extra JSONB
);