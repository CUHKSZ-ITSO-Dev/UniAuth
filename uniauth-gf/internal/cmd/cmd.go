package cmd

import (
	"context"

	"github.com/gogf/gf/v2/frame/g"
	"github.com/gogf/gf/v2/net/ghttp"
	"github.com/gogf/gf/v2/os/gcmd"

	"uniauth-gf/internal/controller/hello"
	"uniauth-gf/internal/controller/userinfos"
)

// const (
// 	SwaggerUITemplate = `
// <!DOCTYPE html>
// <html lang="en">
// <head>
//   <meta charset="utf-8" />
//   <meta name="viewport" content="width=device-width, initial-scale=1" />
//   <meta name="description" content="SwaggerUI" />
//   <title>SwaggerUI</title>
//   <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css" />
// </head>
// <body>
// <div id="swagger-ui"></div>
// <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js" crossorigin></script>
// <script>
//   window.onload = () => {
//     window.ui = SwaggerUIBundle({
//       url: '/api.json',
//       dom_id: '#swagger-ui',
//     });
//   };
// </script>
// </body>
// </html>
// `
// )

var (
	Main = gcmd.Command{
		Name:  "main",
		Usage: "main",
		Brief: "start http server",
		Func: func(ctx context.Context, parser *gcmd.Parser) (err error) {
			s := g.Server()
			s.Group("/", func(group *ghttp.RouterGroup) {
				group.Middleware(ghttp.MiddlewareHandlerResponse)
				group.Bind(
					hello.NewV1(),
				)
			})
			s.Group("/users", func(group *ghttp.RouterGroup) {
				group.Middleware(ghttp.MiddlewareHandlerResponse)
				group.Bind(
					userinfos.NewV1(),
				)
			})
			// s.SetSwaggerUITemplate(SwaggerUITemplate)
			s.Run()
			return nil
		},
	}
)
