package models

import (
	"database/sql/driver"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"time"

	"gorm.io/gorm"
)

// ========== 抽象组数据库模型 ==========
type AbstractGroup struct {
	Name        string            `json:"name" gorm:"unique;"`
	Description string            `json:"description"`
	Type        string            `json:"type"` // "ittools" or "manual"
	Rule        AbstractGroupRule `json:"rule" gorm:"type:json"`
	CreatorUPN  string            `json:"creatorUpn"`

	ID        uint           `json:"id"`
	CreatedAt time.Time      `json:"createdAt" gorm:"autoCreateTime"`
	UpdatedAt time.Time      `json:"updatedAt" gorm:"autoUpdateTime"`
	DeletedAt gorm.DeletedAt `gorm:"index"`
}

// driver.Valuer 存储方式
// 自定义 AbstractGroupRule 字段类型驱动处理方式
func (r AbstractGroupRule) Value() (driver.Value, error) {
	if r.Ittools == nil && r.Manual == nil {
		return nil, nil
	}
	return json.Marshal(r)
}

// sql.Scanner 提取方式
func (r *AbstractGroupRule) Scan(value interface{}) error {
	// 处于健壮性考虑，还是加了nil的判断
	// 按理是不会出现的
	if value == nil {
		*r = AbstractGroupRule{}
		return nil
	}

	// 先从数据库里面提出[]byte数据, 然后反序列化
	var bytes []byte
	switch v := value.(type) {
	case []byte:
		bytes = v
	case string:
		bytes = []byte(v)
	default:
		return errors.New("反序列化 JSON 值失败：不支持的类型")
	}
	log.Println("value: ", fmt.Sprintf("%T", value))
	if len(bytes) == 0 {
		*r = AbstractGroupRule{}
		return nil
	}

	if err := json.Unmarshal(bytes, r); err != nil {
		return err
	}

	// 如果 manual rule 存在，但 upns 是 nil，则初始化为空切片
	if r.Manual != nil && r.Manual.UPNs == nil {
		r.Manual.UPNs = []string{}
	}

	return nil
}

// ========== 自定义数据类型 ==========
// 抽象组抽象规则
// 对于 "ittools" 类型, 它是一个 IttoolsRule 结构
// 对于 "manual" 类型, 它可能是 {"upns": ["user1@example.com", "user2@example.com"]}
type AbstractGroupRule struct {
	Ittools *IttoolsRule `json:"ittools,omitempty"`
	Manual  *ManualRule  `json:"manual,omitempty"`
}

type IttoolsRule struct {
	LogicalOperator string      `json:"logical_operator"` // "AND" or "OR"
	Conditions      []Condition `json:"conditions"`
}

// ITTools 类型规则组中的单个条件
type Condition struct {
	Field    string `json:"field"`
	Operator string `json:"operator"`
	Value    string `json:"value"`
}

type ManualRule struct {
	UPNs []string `json:"upns"`
}
