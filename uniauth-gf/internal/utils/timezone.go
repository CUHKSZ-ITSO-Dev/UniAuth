package utils

import (
	"time"
)

// GetBusinessTimezone 获取业务时区
// 默认使用 Asia/Shanghai，可以通过配置文件覆盖
func GetBusinessTimezone() *time.Location {
	// 优先从配置文件读取，这里先使用默认值
	// 在实际项目中，应该从配置文件中读取
	loc, err := time.LoadLocation("Asia/Shanghai")
	if err != nil {
		// 如果加载失败，使用UTC作为备选
		return time.UTC
	}
	return loc
}

// GetTodayRange 获取今天的开始和结束时间（业务时区）
func GetTodayRange() (start, end time.Time) {
	loc := GetBusinessTimezone()
	now := time.Now().In(loc)

	start = time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, loc)
	end = start.AddDate(0, 0, 1)

	return start, end
}

// GetYesterdayRange 获取昨天的开始和结束时间（业务时区）
func GetYesterdayRange() (start, end time.Time) {
	loc := GetBusinessTimezone()
	now := time.Now().In(loc)

	yesterday := now.AddDate(0, 0, -1)
	start = time.Date(yesterday.Year(), yesterday.Month(), yesterday.Day(), 0, 0, 0, 0, loc)
	end = start.AddDate(0, 0, 1)

	return start, end
}

// GetNDaysAgoRange 获取N天前的开始和结束时间（业务时区）
func GetNDaysAgoRange(days int) (start, end time.Time) {
	loc := GetBusinessTimezone()
	now := time.Now().In(loc)

	targetDate := now.AddDate(0, 0, -days)
	start = time.Date(targetDate.Year(), targetDate.Month(), targetDate.Day(), 0, 0, 0, 0, loc)
	end = start.AddDate(0, 0, 1)

	return start, end
}

// ConvertToBusinessTimezone 将时间转换为业务时区
func ConvertToBusinessTimezone(t time.Time) time.Time {
	loc := GetBusinessTimezone()
	return t.In(loc)
}

// IsInBusinessHours 检查时间是否在业务时间内（9:00-18:00）
func IsInBusinessHours(t time.Time) bool {
	loc := GetBusinessTimezone()
	businessTime := t.In(loc)
	hour := businessTime.Hour()
	return hour >= 9 && hour < 18
}
