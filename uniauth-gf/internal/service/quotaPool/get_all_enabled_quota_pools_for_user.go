package quotaPool

import (
	"context"

	"github.com/gogf/gf/v2/errors/gerror"
	"github.com/gogf/gf/v2/frame/g"

	"uniauth-gf/internal/dao"
	"uniauth-gf/internal/model/entity"
	"uniauth-gf/internal/service/casbin"
)

// GetAllEnabledQuotaPoolsForUser 获取用户所有启用了的配额池
// 参数说明：
//   ctx: 上下文对象，用于控制超时、取消信号等。
//   upn: 用户的唯一标识（User Principal Name）。
//
// 返回值说明：
//   quotaPools: 用户拥有的所有启用状态的配额池名称列表。
//   personalMap: 配额池名称到是否为个人配额池的映射（true 表示个人配额池）。
//   havePersonal: 用户是否拥有至少一个个人配额池（true/false）。
//   err: 错误信息，若无错误则为 nil。
func GetAllEnabledQuotaPoolsForUser(ctx context.Context, upn string) (quotaPools []string, personalMap map[string]bool, havePersonal bool, err error) {
	e := casbin.GetEnforcer()
	roles, err := e.GetRolesForUser(upn)
	if err != nil {
		return nil, nil, false, gerror.Wrap(err, "获取用户所有角色时发生内部错误")
	}

	personalMap = make(map[string]bool)
	for _, role := range roles {
		var quotaPool *entity.QuotapoolQuotaPool
		err := dao.QuotapoolQuotaPool.Ctx(ctx).Where(dao.QuotapoolQuotaPool.Columns().QuotaPoolName, role).Scan(&quotaPool)
		if err != nil {
			return nil, nil, false, gerror.Wrapf(err, "获取配额池 %s 时发生内部错误", role)
		}
		if quotaPool == nil {
			g.Log().Warningf(ctx, "没有找到这个配额池：%v", role)
			continue
		}
		if !quotaPool.Disabled {
			quotaPools = append(quotaPools, role)
			personalMap[role] = quotaPool.Personal
			if quotaPool.Personal {
				havePersonal = true
			}
		}
	}
	return
}
