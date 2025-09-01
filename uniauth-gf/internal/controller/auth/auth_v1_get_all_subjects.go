package auth

import (
	"context"

	"uniauth-gf/api/auth/v1"
)

func (c *ControllerV1) GetAllSubjects(ctx context.Context, req *v1.GetAllSubjectsReq) (res *v1.GetAllSubjectsRes, err error) {
	res = &v1.GetAllSubjectsRes{}
	res.Subjects, err = e.GetAllSubjects()
	if err != nil {
		return nil, err
	}
	return
}
