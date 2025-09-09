package packed

import "github.com/gogf/gf/v2/os/gres"

func init() {
	if err := gres.Add("H4sIAAAAAAAC/wrwZmYRYeBg4GBYyaYRzYAEZBk4GZLzi1Lji5ISk/WS8/PS9FG5oSGsDIz/NPZl5PQFrjqsIOD6n/W7wfvlLhPeHJg6JaCnb62rsZ3x0pLv/T326wUE9si8sz2z9fF77vJ9rj6Vp+dkRm959SChfq2YUij3FjvdHweiMktzQ4p+1Fy/nXmXadnGlyEfqgvZ2c213+8XDT50oDusQmLloy91Ce4zbvV0HrT8sPTCbYkdMQ+ebxEo/C2hfOmVpc2G991hojJ3ltudnppbU9sXclTlpYQ5p1NGLV8Ri6LdBwW7D/EMDAz//wd4s3Pk8y+OWM/AwGDOyMAACwIGBvcATZQg4MMIArCf1X/vzwAZgqw0wJuRSYQZEZLIFoBCEga2NYJI4sIVYSZ2p0GAAMN/R2ZGBtwOZWUDKWNiYGKYycDA4MEI4gECAAD///O+Wcn3AQAA"); err != nil {
		panic("add binary content to resource manager failed: " + err.Error())
	}
}
