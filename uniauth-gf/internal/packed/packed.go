package packed

import "github.com/gogf/gf/v2/os/gres"

func init() {
	if err := gres.Add("H4sIAAAAAAAC/wrwZmYRYeBg4GCoVNeNZkACogycDMn5eWmZ6frJ+UWp8UVJicl6IIHQEFYGRvdfRzJyzjnmtSoIsD2wXT4jj0elxfW7zEJ1g2MKfF2uCx9LPH4r/WbRx6drFYzv/0+POjSfufydO09ht8zna5xM3L8NM04cXnSwUmyRrqVrvW1EZaqUQYi35UNnv4SF1y/8/57A8WKncIT1p65PcyYKpBhKSKxhnR5kN7VpWWP/9oQjb4O8OspK36Qv2SusHTFDZebvFUHzrf/3Xg83nT/JR26alN7XYv2TFufrlZ//NGdg+P8/wJudo7w4kXMlAwMDPyMDA8zTDAx62noonmaDexrsyxOBxzJAmpGVBHgzMokwI8IM2WBQmMHAkkYQiT8EEWZhdwoECDD8d/wKNwvJYaxsIGkmBiaGTgYGBiNGEA8QAAD//3VdQa/RAQAA"); err != nil {
		panic("add binary content to resource manager failed: " + err.Error())
	}
}
