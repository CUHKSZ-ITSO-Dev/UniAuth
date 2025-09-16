package main

import (
	"fmt"
	"time"
	_ "uniauth-gf/internal/packed"

	"uniauth-gf/internal/cmd"

	_ "github.com/gogf/gf/contrib/drivers/pgsql/v2"
	"github.com/gogf/gf/v2/os/gctx"
)

func main() {
	fmt.Println(`
   __  __      _ ___         __  __  
  ╱ ╱ ╱ ╱___  (_)   │ __  __╱ ╱_╱ ╱_ 
 ╱ ╱ ╱ ╱ __ ╲╱ ╱ ╱│ │╱ ╱ ╱ ╱ __╱ __ ╲
╱ ╱_╱ ╱ ╱ ╱ ╱ ╱ ___ ╱ ╱_╱ ╱ ╱_╱ ╱ ╱ ╱
╲____╱_╱ ╱_╱_╱_╱  │_╲__,_╱╲__╱_╱ ╱_╱ 

	`)
	fmt.Println("UniAuth Automated System")
	fmt.Println("Copyright 2025 The Chinese University of Hong Kong, Shenzhen")
	fmt.Println()
	time.Sleep(time.Second)
	// fmt.Println("GRes Directory List:")
	// gres.Dump()
	cmd.Main.Run(gctx.GetInitCtx())
}
