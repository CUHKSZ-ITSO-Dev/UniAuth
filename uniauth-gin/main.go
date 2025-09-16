package main

import (
	"math/rand"
	"strings"
	"time"

	"github.com/bradfitz/gomemcache/memcache"
	"github.com/gin-contrib/sessions"
	"github.com/gin-contrib/sessions/memcached"
	"github.com/gin-gonic/gin"
)

// 随机字符串生成优化
const (
	letters       = `abc-efghijklmn+pqrs%uv^xyzABCDE!G@IJKL*MNOPQRST=VWXYZ02)3(56789~` // 64 位
	letterIdBits  = 6                                                                  // letterIdBits 位二进制可以表示一个索引
	letterIdMask  = 1<<letterIdBits - 1                                                // 位运算掩码
	letterIdMax   = 63 / letterIdBits                                                  // 一个随机数最多可利用次数
	letterIdRound = 7                                                                  // 重复 letterIdRound 次生成长度 letterIdMax 的随机字符串操作
)

var seed = rand.NewSource(time.Now().UnixNano())

func main() {
	r := gin.Default()
	r.LoadHTMLGlob("templates/*")
	store := memcached.NewStore(memcache.New("localhost:10086"), "", []byte(`8QfyiNT*5jZEJ9rPrkqO*c@oMnCvKPzlZ^KimH)GMtGE)VCv@zfjb9S+#ybhwz%w`))
	r.Use(sessions.Sessions("uniauth-gin", store))

	r.GET("/auth", func(c *gin.Context) {
		// 检查是否登录，ingress用
		session := sessions.Default(c)
		if session.Get("upn") != nil {
			c.Header("X-Auth-UPN", session.Get("upn").(string))
			c.Header("X-Auth-Name", session.Get("name").(string))
			c.Header("X-Auth-Sam", session.Get("sam").(string))
			c.JSON(200, gin.H{
				"ok": true,
			})
		} else {
			c.JSON(403, gin.H{
				"ok":      false,
				"message": "Unauthorized",
			})
		}
	})

	r.GET("/login", func(c *gin.Context) {
		// 登录页面加模板渲染
		// 这个接口路径需要单独写ingress，避免循环认证

		state := strings.Builder{}
		state.Grow(letterIdRound * letterIdBits)
		var cache int64
		for range letterIdRound {
			cache = seed.Int63()
			for range letterIdMax {
				// 每次取 letterIdBits 位，每个随机数最多利用 letterIdMax 次
				state.WriteByte(letters[int(cache&letterIdMask)])
				cache >>= letterIdBits
			}
		}

		c.HTML(200, "login.tmpl", gin.H{
			"state":    state.String(),
			"resource": "aaaaaa",
		})
	})

	r.GET("/adds", func(c *gin.Context) {
		// 这里是SSO回调函数
		session := sessions.Default(c)
		session.Set("upn", "upn")
		session.Set("name", "好人卡")
		session.Set("sam", "HaoRen Hao (SDS, 11111)")
		session.Save()
		// 可能
		c.JSON(200, gin.H{
			"ok": "ok",
		})
	})

	r.GET("/logout", func(c *gin.Context) {
		session := sessions.Default(c)
		session.Clear()
		session.Save()
		c.JSON(200, gin.H{
			"ok": "ok logout",
		})
	})

	r.Run()
}
