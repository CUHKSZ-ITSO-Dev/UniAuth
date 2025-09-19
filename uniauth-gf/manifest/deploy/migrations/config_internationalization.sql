CREATE TABLE config_internationalization (
    key TEXT NOT NULL,
    translations JSONB NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (key)
);

CREATE INDEX idx_config_internationalization_translations_text ON config_internationalization USING GIN (
    to_tsvector('simple', translations::text)
);