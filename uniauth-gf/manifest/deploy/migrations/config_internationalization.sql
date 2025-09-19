CREATE TABLE config_internationalization (
    key TEXT NOT NULL,
    zh_cn TEXT,
    en_us TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (key)
);

CREATE INDEX idx_config_internationalization_key ON config_internationalization (key);

CREATE INDEX idx_config_internationalization_zh_cn ON config_internationalization (zh_cn);

CREATE INDEX idx_config_internationalization_en_us ON config_internationalization (en_us);

CREATE INDEX idx_config_internationalization_description ON config_internationalization (description);