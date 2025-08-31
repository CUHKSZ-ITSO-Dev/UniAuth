package storage

import (
	"fmt"
	adminModel "uniauth/internal/modules/admin/model"
	billingModel "uniauth/internal/modules/billing/model"
	rbacModel "uniauth/internal/modules/rbac/model"
	userModel "uniauth/internal/modules/user/model"

	gormadapter "github.com/casbin/gorm-adapter/v3"
	"github.com/glebarez/sqlite"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

// NewDatabaseConnection 根据提供的配置初始化并返回一个GORM数据库连接。
func NewDatabaseConnection(dbType, dsn string) (*gorm.DB, error) {
	var dialector gorm.Dialector
	switch dbType {
	case "postgres":
		dialector = postgres.Open(dsn)
	case "sqlite":
		dialector = sqlite.Open(dsn)
	default:
		return nil, fmt.Errorf("不支持的数据库类型: %s", dbType)
	}

	db, err := gorm.Open(dialector, &gorm.Config{})
	if err != nil {
		return nil, fmt.Errorf("打开数据库失败: %w", err)
	}

	return db, nil
}

// AutoMigrateTables 运行GORM的自动迁移，为所有需要的模型创建或更新表结构。
func AutoMigrateTables(db *gorm.DB) error {
	if err := db.AutoMigrate(
		&billingModel.ChatUserAccount{},
	); err != nil {
		return fmt.Errorf("数据库迁移失败 (第一阶段): %w", err)
	}

	if err := db.AutoMigrate(
		&billingModel.ChatUserCategory{},
		&billingModel.ChatUserCostRecord{},
		&gormadapter.CasbinRule{},
		&userModel.UserInfo{},
		&rbacModel.AbstractGroup{},
		&billingModel.ChatQuotaPool{},
		&adminModel.AdminUser{},
	); err != nil {
		return fmt.Errorf("数据库迁移失败 (第二阶段): %w", err)
	}

	return nil
}
