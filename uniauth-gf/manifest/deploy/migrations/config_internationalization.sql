CREATE TABLE config_internationalization (
    key TEXT PRIMARY KEY,
    zh_cn TEXT NOT NULL,
    en_us TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_config_internationalization_zh_cn ON config_internationalization (zh_cn);

CREATE INDEX idx_config_internationalization_en_us ON config_internationalization (en_us);

CREATE INDEX idx_config_internationalization_description ON config_internationalization (description);