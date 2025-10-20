/**
 * @name 代理的配置
 * @see 在生产环境 代理是无法生效的，所以这里没有生产环境的配置
 * -------------------------------
 * The agent cannot take effect in the production environment
 * so there is no configuration of the production environment
 * For details, please see
 * https://pro.ant.design/docs/deploy
 *
 * @doc https://umijs.org/docs/guides/proxy
 */
export default {
  /**
   * @name 详细的代理配置
   * @doc https://github.com/chimurai/http-proxy-middleware
   */
  dev: {
    "/api/": {
      target: "http://localhost:8000",
      changeOrigin: true,
      pathRewrite: { "^/api/": "" },
      // 禁用代理缓冲，支持SSE流式传输
      onProxyReq: (proxyReq: any, req: any, res: any) => {
        // 设置无缓冲
        proxyReq.setHeader("X-Accel-Buffering", "no");
      },
      onProxyRes: (proxyRes: any, req: any, res: any) => {
        // 对于SSE请求，禁用压缩和缓冲
        if (proxyRes.headers["content-type"]?.includes("text/event-stream")) {
          // 删除可能导致缓冲的头
          delete proxyRes.headers["content-encoding"];
          // 设置立即传输
          proxyRes.headers["cache-control"] = "no-cache, no-transform";
          proxyRes.headers["x-accel-buffering"] = "no";
        }
      },
      // 禁用代理超时
      timeout: 0,
      // 禁用保持连接
      proxyTimeout: 0,
    },
  },
  // test: {
  //   "/api/": {
  //     target: "http://localhost:8000",
  //     changeOrigin: true,
  //     pathRewrite: { "^/api/": "/api/" },
  //   },
  // },
  // pre: {
  //   "/api/": {
  //     target: "http://localhost:8000",
  //     changeOrigin: true,
  //     pathRewrite: { "^/api/": "/api/" },
  //   },
  // },
};
