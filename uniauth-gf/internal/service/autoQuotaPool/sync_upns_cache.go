package autoQuotaPool

import (
    "context"

    "github.com/gogf/gf/v2/database/gdb"
    "github.com/gogf/gf/v2/errors/gerror"
    "github.com/gogf/gf/v2/frame/g"
    "github.com/gogf/gf/v2/os/gtime"

    userinfosv1 "uniauth-gf/api/userinfos/v1"
    "uniauth-gf/internal/controller/userinfos"
    "uniauth-gf/internal/dao"
    "uniauth-gf/internal/model/entity"
)

// SyncOneRuleUpnsCache 重新计算并回写指定规则的 upns_cache，返回匹配到的UPN数量。
func SyncOneRuleUpnsCache(ctx context.Context, ruleName string) (int, error) {
    if ruleName == "" {
        return 0, gerror.New("ruleName 不能为空")
    }

    var matchedCount int
    if err := dao.ConfigAutoQuotaPool.Transaction(ctx, func(ctx context.Context, tx gdb.TX) error {
        // 加锁读取该条规则
        var cfg *entity.ConfigAutoQuotaPool
        if err := dao.ConfigAutoQuotaPool.Ctx(ctx).Where("rule_name = ?", ruleName).LockUpdate().Scan(&cfg); err != nil {
            return gerror.Wrap(err, "查询自动配额池规则失败")
        }
        if cfg == nil {
            return gerror.Newf("未找到规则: %s", ruleName)
        }

        // 解析 FilterGroup
        var filter *userinfosv1.FilterGroup
        if cfg.FilterGroup != nil {
            if err := cfg.FilterGroup.Scan(&filter); err != nil {
                return gerror.Wrap(err, "解析 FilterGroup 失败")
            }
        }

        // 计算 UPN 列表（分页拉取，避免 All 限制）
        upns, err := computeMatchedUpns(ctx, filter)
        if err != nil {
            return gerror.Wrap(err, "根据 FilterGroup 筛选用户失败")
        }
        matchedCount = len(upns)

        // 回写 upns_cache 和 last_evaluated_at
        data := g.Map{
            dao.ConfigAutoQuotaPool.Columns().UpnsCache:       upns,
            dao.ConfigAutoQuotaPool.Columns().LastEvaluatedAt: gtime.Now(),
        }
        if _, err := dao.ConfigAutoQuotaPool.Ctx(ctx).Where("rule_name = ?", ruleName).Data(data).Update(); err != nil {
            return gerror.Wrap(err, "更新 upns_cache 失败")
        }
        return nil
    }); err != nil {
        return 0, gerror.Wrapf(err, "同步规则 %s 的 upns_cache 失败", ruleName)
    }
    return matchedCount, nil
}

// SyncAllRulesUpnsCache 同步所有规则，返回每条规则匹配的数量。
func SyncAllRulesUpnsCache(ctx context.Context) (map[string]int, error) {
    // 先读取所有 rule_name，逐条同步，避免长事务持锁
    var rules []*entity.ConfigAutoQuotaPool
    if err := dao.ConfigAutoQuotaPool.Ctx(ctx).Fields("rule_name").Scan(&rules); err != nil {
        return nil, gerror.Wrap(err, "查询规则列表失败")
    }
    result := make(map[string]int, len(rules))
    for _, r := range rules {
        if r == nil || r.RuleName == "" {
            continue
        }
        cnt, err := SyncOneRuleUpnsCache(ctx, r.RuleName)
        if err != nil {
            return nil, err
        }
        result[r.RuleName] = cnt
    }
    return result, nil
}

func computeMatchedUpns(ctx context.Context, filter *userinfosv1.FilterGroup) ([]string, error) {
    // 空规则直接返回空结果，避免全表扫描
    if isFilterEmpty(filter) {
        return []string{}, nil
    }
    const pageSize = 1000
    page := 1
    upns := make([]string, 0, pageSize)
    for {
        res, err := userinfos.NewV1().Filter(ctx, &userinfosv1.FilterReq{
            Filter: filter,
            Pagination: &userinfosv1.PaginationReq{
                Page:     page,
                PageSize: pageSize,
            },
            Verbose: false,
        })
        if err != nil {
            return nil, err
        }
        upns = append(upns, res.UserUpns...)
        if len(upns) >= res.Total || len(res.UserUpns) == 0 {
            break
        }
        page++
    }
    return upns, nil
}

func isFilterEmpty(fg *userinfosv1.FilterGroup) bool {
    if fg == nil {
        return true
    }
    if len(fg.Conditions) > 0 {
        return false
    }
    for _, sub := range fg.Groups {
        if !isFilterEmpty(sub) {
            return false
        }
    }
    return true
}
