package quotaPool

import (
	"context"

	"github.com/gogf/gf/v2/errors/gerror"
	"github.com/gogf/gf/v2/frame/g"

	"uniauth-gf/internal/dao"
	"uniauth-gf/internal/model/entity"
	"uniauth-gf/internal/service/casbin"
)

// GetAllEnabledQuotaPoolsForUser 获取用户所有启用了的配额池。原理是通过 Casbin 查询用户的配额池，然后查配额池表判断配额池是否被禁用。
// 参数说明：
//
//	ctx: 上下文对象，用于控制超时、取消信号等。
//	upn: 用户的唯一标识（User Principal Name）。
//
// 返回值说明：
//
//	quotaPools: 用户拥有的所有启用状态的配额池名称列表。
//	personalMap: 配额池名称到是否为个人配额池的映射（true 表示个人配额池）。
//	havePersonal: 用户是否拥有至少一个个人配额池（true/false）。
//	err: 错误信息，若无错误则为 nil。
func GetAllEnabledQuotaPoolsForUser(ctx context.Context, upn string) (quotaPools []string, personalMap g.MapStrBool, havePersonal bool, err error) {
	e := casbin.GetEnforcer()
	roles, err := e.GetRolesForUser(upn)
	if err != nil {
		return nil, nil, false, gerror.Wrap(err, "获取用户所有角色时发生内部错误")
	}
	if len(roles) == 0 {
		return []string{}, g.MapStrBool{}, false, nil
	}

	// 直接获取所有的配额池并建立索引
	var allQuotaPools []*entity.QuotapoolQuotaPool
	if err = dao.QuotapoolQuotaPool.Ctx(ctx).WhereIn(dao.QuotapoolQuotaPool.Columns().QuotaPoolName, roles).Scan(&allQuotaPools); err != nil {
		err = gerror.Wrap(err, "批量获取配额池时发生内部错误")
		return
	}
	foundPools := make(map[string]*entity.QuotapoolQuotaPool, len(allQuotaPools))
	for _, qp := range allQuotaPools {
		foundPools[qp.QuotaPoolName] = qp
	}

	personalMap = make(map[string]bool, len(roles))
	for _, role := range roles {
		qp, ok := foundPools[role]
		if !ok {
			g.Log().Warningf(ctx, "%v 拥有这个配额池，但是没有找到这个配额池的记录：%v", upn, role)
			continue
		}
		if qp.Personal {
			// 注意：是否有个人池的判断不受配额池是否启用影响
			// 被禁用的个人配额池，也算有个人配额池
			havePersonal = true
		}
		if !qp.Disabled {
			quotaPools = append(quotaPools, role)
			personalMap[role] = qp.Personal
		}
	}
	return
}
