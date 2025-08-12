package models

import (
	"fmt"
	"time"

	"github.com/shopspring/decimal"
	"gorm.io/gorm"
)

// 对话基础账户
type ChatUserAccount struct {
	gorm.Model
	UPN           string          `json:"upn" gorm:"size:200;unique;"`
	Balance       decimal.Decimal `json:"balance" gorm:"default:0.0000000000"`
	TokenPackage  decimal.Decimal `json:"tokenBalance" gorm:"default:0.0000000000"`
	LastResetTime time.Time       `json:"lastResetTime"`

	// 关联关系 - 一对多消费记录
	// gorm 迁移时忽略，避免导致外键错误
	CostRecords []ChatUserCostRecord `json:"costRecords" gorm:"-;foreignKey:UPN;references:UPN;"`
}

// ChatUserCategory 用户分组模型
// 对应 Casbin 抽象组
type ChatUserCategory struct {
	gorm.Model
	Name         string          `json:"name" gorm:"size:200; unique;"`
	DefaultQuota decimal.Decimal `json:"defaultQuota" gorm:"type:decimal(25,10); default:0.0000000000"`
	ResetCircle  int             `json:"resetCircle" gorm:"default:7"`
	Priority     int16           `json:"priority" gorm:"type:INT2; default:16384"`

	ChatQuotaPoolID *uint          `json:"chatQuotaPoolId,omitempty"`
	QuotaPool       *ChatQuotaPool `json:"quotaPool,omitempty" gorm:"foreignKey:ChatQuotaPoolID"`
}

type ChatQuotaPool struct {
	gorm.Model
	Name          string          `json:"name" gorm:"size:200; unique;"`
	Balance       decimal.Decimal `json:"balance" gorm:"type:decimal(25,10); default:0.0000000000"`
	DefaultQuota  decimal.Decimal `json:"defaultQuota" gorm:"type:decimal(25,10); default:0.0000000000"`
	LastResetTime time.Time       `json:"lastResetTime"`
}

type ChatUserCostRecord struct {
	ID uint `gorm:"primarykey"`

	Cost   decimal.Decimal `json:"cost" gorm:"type:decimal(25,10); default:0.0000000000"`
	Model  string          `json:"model" gorm:"size:200;"`
	Source string          `json:"source" gorm:"size:200;"` // 资金来源：self 或 预算池名称
	Tokens int64           `json:"tokens" gorm:"default:0"` // 消耗的token数量
	Kind   string          `json:"kind" gorm:"size:20;"`    // 计费类型：self 或 pool

	// 关联关系
	UPN  string           `json:"upn" gorm:"size:200;"`
	User *ChatUserAccount `json:"user" gorm:"foreignKey:UPN;references:UPN;"`

	CreatedAt time.Time
	UpdatedAt time.Time
	DeletedAt gorm.DeletedAt `gorm:"index"`
}

// =====模型方法=====

// DeductBalance 在一个事务中执行扣款操作，并返回资金来源。
// 这个方法期望被一个外部的数据库事务调用。
func (c *ChatUserAccount) DeductBalance(tx *gorm.DB, userCategories []*ChatUserCategory, amountBalance decimal.Decimal) (string, string, error) {
	// 阶段一：基础信息校验和获取
	// 重新加载用户并锁定，确保数据一致性
	var userAccount ChatUserAccount
	if err := tx.Set("gorm:query_option", "FOR UPDATE").Where("upn = ?", c.UPN).First(&userAccount).Error; err != nil {
		return "", "", fmt.Errorf("获取用户账户失败: %w", err)
	}

	primaryCategory := getPrimaryCategory(userCategories)
	if primaryCategory == nil {
		return "", "", fmt.Errorf("%s 用户没有绑定用户组", userAccount.UPN)
	}

	// 阶段二：扣费
	var source string
	var kind string
	if primaryCategory.QuotaPool == nil {
		// 独立预算：扣除用户自身余额
		userAccount.Balance = userAccount.Balance.Sub(amountBalance)
		source = "self"
		kind = "self"

		// 保存用户账户更新
		if err := tx.Save(&userAccount).Error; err != nil {
			return "", "", fmt.Errorf("保存用户账户失败: %w", err)
		}
	} else {
		// 预算池：锁定并扣除预算池的额度
		if err := tx.Set("gorm:query_option", "FOR UPDATE").First(primaryCategory.QuotaPool).Error; err != nil {
			return "", "", fmt.Errorf("锁定用户组的预算池失败: %w", err)
		}
		primaryCategory.QuotaPool.Balance = primaryCategory.QuotaPool.Balance.Sub(amountBalance)
		source = primaryCategory.QuotaPool.Name
		kind = "pool"

		// 保存预算池更新
		if err := tx.Save(primaryCategory.QuotaPool).Error; err != nil {
			return "", "", fmt.Errorf("保存用户组的预算池失败: %w", err)
		}
	}

	return source, kind, nil
}

// 获取用户的总剩余用量（余额+流量包）
func (c *ChatUserAccount) GetTotalBalance() (string, error) {
	return c.Balance.Add(c.TokenPackage).String(), nil
}

// 重置用户余额
func (c *ChatUserAccount) ResetBalance(db *gorm.DB, userCategories []*ChatUserCategory, resetAnyway bool) error {
	return db.Transaction(func(tx *gorm.DB) error {
		// 重新加载用户账户以获取最新数据并锁定
		var userAccount ChatUserAccount
		if err := tx.Set("gorm:query_option", "FOR UPDATE").Where("upn = ?", c.UPN).First(&userAccount).Error; err != nil {
			return fmt.Errorf("获取用户账户失败: %w", err)
		}

		primaryCategory := getPrimaryCategory(userCategories)
		if primaryCategory == nil {
			return fmt.Errorf("用户 %s 没有绑定用户组", userAccount.UPN)
		}

		if primaryCategory.QuotaPool == nil {
			// 用户独立预算
			if resetAnyway || time.Since(userAccount.LastResetTime) >= time.Duration(primaryCategory.ResetCircle)*24*time.Hour {
				userAccount.Balance = primaryCategory.DefaultQuota
				userAccount.LastResetTime = time.Now()
				if err := tx.Save(&userAccount).Error; err != nil {
					return fmt.Errorf("保存用户账户失败: %w", err)
				}
			}
		} else {
			// 预算池 - 直接操作已加载的用户组
			// 锁定预算池实体
			if err := tx.Set("gorm:query_option", "FOR UPDATE").First(primaryCategory.QuotaPool).Error; err != nil {
				return fmt.Errorf("锁定用户组的预算池失败: %w", err)
			}

			if resetAnyway || time.Since(primaryCategory.QuotaPool.LastResetTime) >= time.Duration(primaryCategory.ResetCircle)*24*time.Hour {
				primaryCategory.QuotaPool.Balance = primaryCategory.QuotaPool.DefaultQuota
				primaryCategory.QuotaPool.LastResetTime = time.Now()
				if err := tx.Save(primaryCategory.QuotaPool).Error; err != nil {
					return fmt.Errorf("保存用户组的预算池失败: %w", err)
				}
			}
		}
		return nil
	})
}

// =====辅助函数=====

// 获取用户的主要组
func getPrimaryCategory(categories []*ChatUserCategory) *ChatUserCategory {
	if len(categories) == 0 {
		return nil
	}
	// 先找最小优先级组
	minPriority := categories[0].Priority
	for _, category := range categories {
		if category.Priority < minPriority {
			minPriority = category.Priority
		}
	}
	// 如果有多个相同的最小优先级的组，则挑最大的defaultQuota
	var primaryCategory *ChatUserCategory
	var maxQuota decimal.Decimal = decimal.Zero
	for i := range categories {
		if categories[i].Priority == minPriority {
			if primaryCategory == nil || categories[i].DefaultQuota.GreaterThan(maxQuota) {
				primaryCategory = categories[i]
				maxQuota = categories[i].DefaultQuota
			}
		}
	}
	return primaryCategory
}
