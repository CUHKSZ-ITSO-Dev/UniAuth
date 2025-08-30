package main

import (
	_ "uniauth-gf/internal/packed"

	_ "github.com/gogf/gf/contrib/drivers/pgsql/v2"

	"github.com/gogf/gf/v2/os/gctx"

	"uniauth-gf/internal/cmd"
)

func main() {
	cmd.Main.Run(gctx.GetInitCtx())
}
