package main

import (
	_ "uniauth-gf/internal/packed"

	"uniauth-gf/internal/cmd"

	_ "github.com/gogf/gf/contrib/drivers/pgsql/v2"
	"github.com/gogf/gf/v2/os/gctx"
)

func main() {
	cmd.Main.Run(gctx.GetInitCtx())
}
