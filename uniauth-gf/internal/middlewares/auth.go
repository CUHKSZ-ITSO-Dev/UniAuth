package middlewares

import (
    "net/http"
    "path"
    "strings"

    "github.com/gogf/gf/v2/net/ghttp"
)

// AdminAuthMiddleware enforces login for /api/v1/** except the following scopes:
//   - /api/v1/{module}/public/**
//   - /api/v1/{module}/internal/**
// Scope is strictly the path segment immediately after {module}, preventing nested bypass
// like /api/v1/admin/users/public/details.
// Auth state is determined via session key "auth.loggedIn" set by the login handler.
func AdminAuthMiddleware(r *ghttp.Request) {
    cleaned := path.Clean(r.URL.Path)

    // Only guard endpoints under /api/v1
    if strings.HasPrefix(cleaned, "/api/v1/") || cleaned == "/api/v1" {
        // Split into segments for strict scope detection
        // Example: /api/v1/auth/public/uniauth/login -> [api v1 auth public uniauth login]
        segs := strings.Split(strings.TrimPrefix(cleaned, "/"), "/")
        if len(segs) >= 2 && segs[0] == "api" && segs[1] == "v1" {
            // Expected pattern: /api/v1/{module}/{scope}/...
            scope := ""
            if len(segs) >= 4 {
                scope = segs[3]
            }

            // Bypass only when scope is exactly "public" or "internal"
            if scope == "public" || scope == "internal" {
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
    }

    r.Middleware.Next()
}
