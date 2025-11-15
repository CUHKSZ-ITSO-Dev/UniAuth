package main

// 类型定义

type Config struct {
	// 数据库连接相关
	DSN string `v:"required"`

	// SSO 系统相关
	QUERY_API_KEYS       []string `v:"required"`
	USER_QUERY_URL       string   `v:"required"`
	USER_QUERY_COUNT_URL string   `v:"required"`
	ENCRYPT_PASSWORD     string   `v:"required"`
	OPERATE_NAME         string   `v:"required"`

	// 本同步工具相关
	MAX_CONCURRENT_REQUESTS int `v:"required"`
	PAGE_SIZE               int `v:"required"`
}

type UserCount struct {
	Code       int // 999 代表成功
	Msg        string
	TotalCount int
}

// 查询结果结构
type UserInfo struct {
	UserPrincipalName    string
	Mail                 string
	DisplayName          string
	SamAccountName       string
	ExtensionAttribute5  string
	ExtensionAttribute7  string
	EmployeeID           string
	Name                 string
	Department           string
	Title                string
	Office               string
	OfficePhone          string
	EmployeeType         string
	ExtensionAttribute1  string
	ExtensionAttribute2  string
	ExtensionAttribute3  string
	ExtensionAttribute4  string
	ExtensionAttribute6  string
	ExtensionAttribute10 string
	MailNickname         string
	MemberOf             []string
}

type UserInfoFetchResult struct {
	Code      int
	Msg       string
	PageIndex int
	PageSize  int
	Data      []UserInfo
}
