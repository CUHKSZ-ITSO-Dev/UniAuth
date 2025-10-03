package quotaPool

import (
    v1 "uniauth-gf/api/userinfos/v1"
)

// isUserinfosFilterEmpty 判断 userinfos 的筛选规则是否为空
// 为空的定义：规则为 nil，或无任何条件且所有子组也为空
func isUserinfosFilterEmpty(group *v1.FilterGroup) bool {
    if group == nil {
        return true
    }
    // 有任意有效条件则不为空
    for _, c := range group.Conditions {
        if c != nil {
            return false
        }
    }
    // 递归检查子组
    for _, sub := range group.Groups {
        if !isUserinfosFilterEmpty(sub) {
            return false
        }
    }
    return true
}

