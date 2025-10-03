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
func SyncUpnsCache(ctx context.Context, ruleNames []string) (matchedCount int64, err error) {
	if err := dao.ConfigAutoQuotaPool.Transaction(ctx, func(ctx context.Context, tx gdb.TX) error {
        var autoQuotaPoolList []*entity.ConfigAutoQuotaPool
        // 一次性拿到所有数据并锁定数据表，避免逐条锁定导致数据库死锁
        if err := dao.ConfigAutoQuotaPool.Ctx(ctx).
            OmitEmpty().
            WhereIn("rule_name", ruleNames).
            LockUpdate().
            Scan(&autoQuotaPoolList); err != nil {
			return gerror.Wrapf(err, "获取自动配额池 %v 记录失败", ruleNames)
		}

        // 计算需要更新的数据
        var updateData g.ListStrAny
		for _, config := range autoQuotaPoolList {
			var cfgFilterGroup userinfosV1.FilterGroup
			if err := config.FilterGroup.Scan(&cfgFilterGroup); err != nil {
				return gerror.Wrapf(err, "解析 自动配额池 %v FilterGroup 失败", config.RuleName)
			}
			if upnListRes, err := userinfos.NewV1().Filter(ctx, &userinfosV1.FilterReq{
				Filter: &cfgFilterGroup,
				Pagination: &userinfosV1.PaginationReq{
					All: true,
				},
				Verbose: false,
			}); err != nil {
				return gerror.Wrapf(err, "根据 FilterGroup 筛选用户失败")
			} else {
                updateData = append(updateData, g.Map{
                    "rule_name": config.RuleName,
                    "upns_cache": upnListRes.UserUpns,
                    "last_evaluated_at": gtime.Now(),
                })
            }
		}

		// 写入数据库 upns_cache 和 last_evaluated_at
		if updateSqlResult, err := dao.ConfigAutoQuotaPool.
			Ctx(ctx).
            Data(updateData).
			Update(); err != nil {
			return gerror.Wrap(err, "更新 upns_cache 失败")
		} else {
			matchedCount, _ = updateSqlResult.RowsAffected()
		}
		return nil
	}); err != nil {
		err = gerror.Wrapf(err, "同步 upns_cache 事务失败，所有操作已回滚")
		return 0, err
	}
	return matchedCount, nil
}
