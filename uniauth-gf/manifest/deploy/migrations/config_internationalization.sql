DROP TABLE IF EXISTS config_internationalization;

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

-- 插入一些初始数据注意key应该是用至少一个.分隔的字符串，以便支持层级结构
INSERT INTO
    config_internationalization (
        key,
        zh_cn,
        en_us,
        description
    )
VALUES (
        'app.title',
        '应用标题',
        'App Title',
        'The title of the application'
    ),
    (
        'app.description',
        '应用描述',
        'App Description',
        'A brief description of the application'
    ),
    (
        'button.submit',
        '提交',
        'Submit',
        'Text for submit buttons'
    ),
    (
        'button.cancel',
        '取消',
        'Cancel',
        'Text for cancel buttons'
    ),
    (
        'label.username',
        '用户名',
        'Username',
        'Label for username fields'
    ),
    (
        'label.password',
        '密码',
        'Password',
        'Label for password fields'
    ),
    (
        'message.welcome',
        '欢迎来到我们的应用！',
        'Welcome to our application!',
        'Welcome message on the homepage'
    ),
    (
        'error.404',
        '未找到页面',
        'Page Not Found',
        'Error message for 404 pages'
    ),
    (
        'error.500',
        '服务器错误',
        'Server Error',
        'Error message for 500 pages'
    );