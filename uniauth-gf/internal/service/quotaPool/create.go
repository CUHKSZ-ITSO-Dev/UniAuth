package quotaPool

import (
	"context"

	"github.com/gogf/gf/v2/database/gdb"
	"github.com/gogf/gf/v2/errors/gerror"
	"github.com/gogf/gf/v2/frame/g"
	"github.com/robfig/cron/v3"

	v1 "uniauth-gf/api/userinfos/v1"
	"uniauth-gf/internal/controller/userinfos"
	"uniauth-gf/internal/dao"
	"uniauth-gf/internal/model/entity"
	"uniauth-gf/internal/service/casbin"
)

func Create(ctx context.Context, newQuotaPoolInfo *entity.QuotapoolQuotaPool) (err error) {
	// 校验 cron 表达式
	if _, cronErr := cron.ParseStandard(newQuotaPoolInfo.CronCycle); cronErr != nil {
		err = gerror.Newf("cronCycle 无效: %v", cronErr)
		return
	}
	err = dao.QuotapoolQuotaPool.Transaction(ctx, func(ctx context.Context, tx gdb.TX) error {
		// 根据 userinfos 规则，筛选出符合规则的用户
		var filterGroup *v1.FilterGroup
		if err = newQuotaPoolInfo.UserinfosRules.Scan(&filterGroup); err != nil {
			return gerror.Wrap(err, "解析 UserinfosRules 失败")
		}
		filterRes, err := userinfos.NewV1().Filter(ctx, &v1.FilterReq{
			Filter:  filterGroup,
			Verbose: false,
			Pagination: &v1.PaginationReq{
				All: true,
			},
		})
		if err != nil {
			return gerror.Wrap(err, "根据 UserinfosRules 筛选用户失败")
		}

		// 建立配额池
		if _, err = dao.QuotapoolQuotaPool.Ctx(ctx).Where("quota_pool_name = ?", newQuotaPoolInfo.QuotaPoolName).Data(newQuotaPoolInfo).Insert(); err != nil {
			return gerror.Wrap(err, "新增配额池失败")
		}

		// 建立 casbin 角色继承
		groupings := make([][]string, 0, len(filterRes.UserUpns))
		for _, upn := range filterRes.UserUpns {
			groupings = append(groupings, []string{upn, newQuotaPoolInfo.QuotaPoolName})
		}
		e := casbin.GetEnforcer()
		if noDuplicate, err := e.AddGroupingPoliciesEx(groupings); err != nil {
			return gerror.Wrap(err, "Casbin 批量新增配额池角色失败")
		} else if !noDuplicate {
			g.Log().Warningf(ctx, "新增配额池 %v 的角色时，发现重复角色。", newQuotaPoolInfo.QuotaPoolName)
		}
		return nil
	})
	if err != nil {
		return gerror.Wrapf(err, "新增配额池 %v 事务失败", newQuotaPoolInfo.QuotaPoolName)
	}
	return nil
}
