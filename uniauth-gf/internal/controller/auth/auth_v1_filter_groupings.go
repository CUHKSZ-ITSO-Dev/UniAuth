package auth

import (
	"context"
	"fmt"
	"math"
	"strings"

	v1 "uniauth-gf/api/auth/v1"
)

func (c *ControllerV1) FilterGroupings(ctx context.Context, req *v1.FilterGroupingsReq) (res *v1.FilterGroupingsRes, err error) {
	groupings, err := e.GetGroupingPolicy()
	if err != nil {
		return nil, err
	}

	var resGroupings = [][]string{}
	for _, grouping := range groupings {
		g1, g2 := grouping[0], grouping[1]
		if strings.Contains(g1, req.G1) &&
			strings.Contains(g2, req.G2) &&
			strings.Contains(fmt.Sprintf("g, %v, %v", g1, g2), req.Rule) {
			resGroupings = append(resGroupings, grouping)
		}
	}

	res = &v1.FilterGroupingsRes{
		Total:      len(resGroupings),
		Page:       req.Page,
		PageSize:   req.PageSize,
		TotalPages: int(math.Ceil(float64(len(resGroupings)) / float64(req.PageSize))),
	}
	if req.Page*req.PageSize > len(resGroupings) {
		res.Groupings = resGroupings[(req.Page-1)*req.PageSize:]
	} else {
		res.Groupings = resGroupings[(req.Page-1)*req.PageSize : req.Page*req.PageSize]
	}
	return
}
