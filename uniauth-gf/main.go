package main

import (
	"uniauth-gf/internal/cmd"
	_ "uniauth-gf/internal/packed"

	_ "github.com/gogf/gf/contrib/drivers/pgsql/v2"
	"github.com/gogf/gf/v2/os/gctx"
)

func main() {
	cmd.Main.Run(gctx.GetInitCtx())
}
