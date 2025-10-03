package autoQuotaPool

import (
	"context"

	"github.com/gogf/gf/v2/database/gdb"
	"github.com/gogf/gf/v2/errors/gerror"
	"github.com/gogf/gf/v2/frame/g"
	"github.com/gogf/gf/v2/os/gtime"

	userinfosV1 "uniauth-gf/api/userinfos/v1"
	userinfos "uniauth-gf/internal/controller/userinfos"
	"uniauth-gf/internal/dao"
	"uniauth-gf/internal/model/entity"
)

// SyncOneRuleUpnsCache 重新计算并回写指定规则的 upns_cache，返回匹配到的UPN数量。
func SyncUpnsCache(ctx context.Context, ruleNames []string) (matchedCountMap g.MapStrInt, err error) {
	if err := dao.ConfigAutoQuotaPool.Transaction(ctx, func(ctx context.Context, tx gdb.TX) (error) {
		if len(ruleNames) == 0 {
			if err = dao.ConfigAutoQuotaPool.Ctx(ctx).Fields("rule_name").Scan(&ruleNames); err != nil {
				return gerror.Wrap(err, "获取所有自动配额池的名称列表失败")
			}
		}

		var cfg *entity.ConfigAutoQuotaPool
		for _, ruleName := range ruleNames {
			if err := dao.ConfigAutoQuotaPool.Ctx(ctx).Where("rule_name = ?", ruleName).LockUpdate().Scan(&cfg); err != nil {
				return gerror.Wrapf(err, "获取自动配额池 %v 记录失败", ruleName)
			}
			if cfg == nil {
				return gerror.Newf("未找到规则: %s", ruleName)
			}
            
            var cfgFilterGroup userinfosV1.FilterGroup
            if err := cfg.FilterGroup.Scan(&cfgFilterGroup); err != nil {
                return gerror.Wrapf(err, "解析 自动配额池 %v FilterGroup 失败", ruleName)
            }
			upnListRes, err := userinfos.NewV1().Filter(ctx, &userinfosV1.FilterReq{
				Filter: &cfgFilterGroup,
                Pagination: &userinfosV1.PaginationReq{
                    All: true,
                },
                Verbose: false,
			}); 
            if err != nil {
                return gerror.Wrapf(err, "根据 FilterGroup 筛选用户失败")
            }

            // 回写 upns_cache 和 last_evaluated_at
            if updateSqlResult, err := dao.ConfigAutoQuotaPool.
                Ctx(ctx).
                Where("rule_name = ?", ruleName).
                Data(g.Map{
                    "upns_cache": upnListRes.UserUpns,
                    "last_evaluated_at": gtime.Now(),
                }).
                Update(); err != nil {
                return gerror.Wrap(err, "更新 upns_cache 失败")
            } else{
                 rowAffected, _ := updateSqlResult.RowsAffected()
                 matchedCountMap[ruleName] = int(rowAffected)
            }
		}
		return nil
	}); err != nil {
		err = gerror.Wrapf(err, "同步规则 upns_cache 失败，所有操作已回滚")
        return g.MapStrInt{}, err
	}
	return matchedCountMap, nil
}
