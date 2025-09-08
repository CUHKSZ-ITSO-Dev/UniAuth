CREATE TABLE config_exchange_rate (
    date DATE,
    f VARCHAR(3),
    t VARCHAR(3),
    rate NUMERIC(25, 10) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (date, f, t)
);

COMMENT ON COLUMN config_exchange_rate.date IS '汇率日期';
COMMENT ON COLUMN config_exchange_rate.f IS '本位货币';
COMMENT ON COLUMN config_exchange_rate.t IS '标的货币';
COMMENT ON COLUMN config_exchange_rate.rate IS '1 本位货币 = rate 标的货币';