CREATE SCHEMA IF NOT EXISTS config;

CREATE TABLE config.internationalization (
    lang_code VARCHAR(5),
    key text,
    value text,
    description text,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    PRIMARY KEY (lang_code, key)
)