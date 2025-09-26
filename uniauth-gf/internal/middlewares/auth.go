package middlewares

import (
	"net/http"
	"strings"

	"github.com/gogf/gf/v2/net/ghttp"
)

// AdminAuthMiddleware enforces login for /api/v1/** except the following:
//   - Any path under /api/v1/**/public/**
//   - Any path under /api/v1/**/internal/**
//
// These two categories are bypassed (no auth required) to avoid mistakes (fail-safe).
// Auth state is determined via session key "auth.loggedIn" set by the login handler.
func AdminAuthMiddleware(r *ghttp.Request) {
	path := r.URL.Path

	// Only guard endpoints under /api/v1
	if strings.HasPrefix(path, "/api/v1/") {
		// Bypass for /public and /internal endpoints, re: ^/api/v1/[^/]+/public/[^/]+$ or ^/api/v1/[^/]+/internal/[^/]+$
		if strings.Contains(path, "/public/") || strings.HasSuffix(path, "/public") ||
			strings.Contains(path, "/internal/") || strings.HasSuffix(path, "/internal") {
			r.Middleware.Next()
			return
		}

		// Require login for all other /api/v1/** endpoints
		if !r.Session.MustGet("auth.loggedIn").Bool() {
			// 403 will be translated into unified JSON by UniResMiddleware
			r.Response.WriteStatus(http.StatusForbidden)
			return
		}
	}

	r.Middleware.Next()
}
