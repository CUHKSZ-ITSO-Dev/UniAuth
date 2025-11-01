CREATE TABLE config_internationalization (
    key TEXT NOT NULL,
    app_id TEXT NOT NULL DEFAULT 'uniauthAdmin',
    zh_cn TEXT NOT NULL,
    en_us TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (key, app_id)
);

CREATE INDEX idx_config_internationalization_app_id ON config_internationalization (app_id);

CREATE INDEX idx_config_internationalization_key_app ON config_internationalization (key, app_id);

CREATE INDEX idx_config_internationalization_zh_cn ON config_internationalization (zh_cn);

CREATE INDEX idx_config_internationalization_en_us ON config_internationalization (en_us);

CREATE INDEX idx_config_internationalization_description ON config_internationalization (description);