CREATE SCHEMA IF NOT EXISTS config;

CREATE TABLE config.exchange_rate (
    date       DATE,
    from       VARCHAR(3),
    to         VARCHAR(3),
    rate       DECIMAL(15, 4),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    PRIMARY KEY (date, from, to)
);
