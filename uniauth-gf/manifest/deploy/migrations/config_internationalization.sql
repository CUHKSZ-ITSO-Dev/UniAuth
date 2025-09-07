CREATE TABLE config_internationalization (
    lang_code VARCHAR(5),
    key TEXT,
    value TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (lang_code, key)
)