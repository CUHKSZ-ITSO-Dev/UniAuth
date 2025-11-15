package main

import (
	"context"
	"encoding/json"
	"strings"
	"sync"

	"github.com/gogf/gf/v2/errors/gerror"
	"github.com/gogf/gf/v2/frame/g"
	"github.com/gogf/gf/v2/os/gtime"
	"github.com/lib/pq"
)

func FetchOnePage(ctx context.Context, wg *sync.WaitGroup, semaphore chan struct{}, apiKey string, page int) {
	defer wg.Done()

	semaphore <- struct{}{}
	client := g.Client().ContentJson().SetHeader("x-api-key", apiKey)
	response, err := client.Post(
		ctx,
		config.USER_QUERY_URL,
		g.Map{
			"OperateName":     config.OPERATE_NAME,
			"EncryptPassword": config.ENCRYPT_PASSWORD,
			"PageIndex":       page,
			"PageSize":        config.PAGE_SIZE,
		},
	)
	if err != nil {
		g.Log().Error(ctx, gerror.Wrapf(err, "[%s] 获取用户数据失败。当前页码：%d。", apiKey[:8], page))
		return
	}
	<-semaphore
	var res UserInfoFetchResult
	if err := json.Unmarshal(response.ReadAll(), &res); err != nil {
		g.Log().Error(ctx, gerror.Wrapf(err, "[%s] 解析用户数据失败。当前页码：%d。", apiKey[:8], page))
		return
	}

	for _, user := range res.Data {
		// 写入数据库。先把 SSO 返回的字段做一个映射。
		record := UserinfosUserInfos{
			Upn:                        user.UserPrincipalName,
			Email:                      user.Mail,
			DisplayName:                user.DisplayName,
			SamAccountName:             user.SamAccountName,
			SchoolStatus:               user.ExtensionAttribute5,
			IdentityType:               user.ExtensionAttribute7,
			EmployeeID:                 user.EmployeeID,
			Name:                       user.Name,
			Department:                 user.Department,
			Title:                      user.Title,
			Office:                     user.Office,
			OfficePhone:                user.OfficePhone,
			EmployeeType:               user.EmployeeType,
			FundingTypeOrAdmissionYear: user.ExtensionAttribute1,
			StudentCategoryPrimary:     user.ExtensionAttribute2,
			StudentCategoryDetail:      user.ExtensionAttribute3,
			StudentNationalityType:     user.ExtensionAttribute4,
			ResidentialCollege:         user.ExtensionAttribute6,
			StaffRole:                  user.ExtensionAttribute10,
			MailNickname:               user.MailNickname,
			Tags:                       pq.StringArray(strings.Split(user.MemberOf, ",")),
			UpdatedAt:                  gtime.Now().Time,
			CreatedAt:                  gtime.Now().Time,
		}
		if err := UpdateRecord(ctx, &record); err != nil {
			g.Log().Error(ctx, gerror.Wrapf(err, "[%s] 更新用户数据失败。当前页码：%d", apiKey[:8], page))
			return
		}
	}
}
