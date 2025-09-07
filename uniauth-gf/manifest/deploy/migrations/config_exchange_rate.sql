CREATE TABLE config_exchange_rate (
    date DATE,
    f VARCHAR(3),
    t VARCHAR(3),
    rate DECIMAL(15, 4),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (date, f, t)
);