CREATE TABLE config_single_model_approach (
    approach_name VARCHAR(255) PRIMARY KEY,
    pricing JSONB,
    discount NUMERIC(25, 10),
    client_type VARCHAR(255),
    client_args JSONB,
    request_args JSONB,
    servicewares VARCHAR(255)[],
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);