package middlewares

import (
	"mime"
	"net/http"

	"github.com/gogf/gf/v2/errors/gcode"
	"github.com/gogf/gf/v2/errors/gerror"
	"github.com/gogf/gf/v2/net/ghttp"
)

const (
	contentTypeEventStream  = "text/event-stream"
	contentTypeOctetStream  = "application/octet-stream"
	contentTypeMixedReplace = "multipart/x-mixed-replace"
)

var (
	// streamContentType is the content types for stream response.
	streamContentType = []string{contentTypeEventStream, contentTypeOctetStream, contentTypeMixedReplace}
)

type UnifiedResponse struct {
	Success      bool        `json:"success" dc:"Success flag"`
	ErrorCode    int         `json:"code"    dc:"Error code"`
	ErrorMessage string      `json:"message" dc:"Error message"`
	Data         interface{} `json:"data"    dc:"Result data for certain request according API definition"`
	ShowType     int         `json:"showType" dc:"Show type"`
}

func UniResMiddleware(r *ghttp.Request) {
	r.Middleware.Next()

	// 如果 Response 已经被认为修改，则直接返回不做处理
	if r.Response.BufferLength() > 0 || r.Response.Writer.BytesWritten() > 0 {
		return
	}

	// 流式响应不处理
	mediaType, _, _ := mime.ParseMediaType(r.Response.Header().Get("Content-Type"))
	for _, ct := range streamContentType {
		if mediaType == ct {
			return
		}
	}

	var (
		msg  string
		err  = r.GetError()
		res  = r.GetHandlerResponse()
		code = gerror.Code(err)
	)
	if err != nil {
		if code == gcode.CodeNil {
			code = gcode.CodeInternalError
		}
		msg = err.Error()
	} else {
		if r.Response.Status > 0 && r.Response.Status != http.StatusOK {
			switch r.Response.Status {
			case http.StatusNotFound:
				code = gcode.CodeNotFound
			case http.StatusForbidden:
				code = gcode.CodeNotAuthorized
			default:
				code = gcode.CodeUnknown
			}
			// It creates an error as it can be retrieved by other middlewares.
			err = gerror.NewCode(code, msg)
			r.SetError(err)
		} else {
			code = gcode.CodeOK
		}
		msg = code.Message()
	}

	r.Response.WriteJson(UnifiedResponse{
		Success:      code == gcode.CodeOK,
		ErrorCode:    code.Code(),
		ErrorMessage: msg,
		Data:         res,
		ShowType:     2,
	})
}
