package main

import (
	_ "uniauth-gf/internal/packed"

	"github.com/gogf/gf/v2/os/gctx"

	"uniauth-gf/internal/cmd"
)

func main() {
	cmd.Main.Run(gctx.GetInitCtx())
}
