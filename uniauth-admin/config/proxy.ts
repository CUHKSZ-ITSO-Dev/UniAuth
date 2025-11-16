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
    // 只代理后端 API 请求，不代理前端资源
    "/auth": {
      target: "http://localhost:8004",
      changeOrigin: true,
      headers: { "X-Service": "uniauth-gf" },
    },
    "/config": {
      target: "http://localhost:8004",
      changeOrigin: true,
      headers: { "X-Service": "uniauth-gf" },
    },
    "/quotaPool": {
      target: "http://localhost:8004",
      changeOrigin: true,
      headers: { "X-Service": "uniauth-gf" },
    },
    "/billing": {
      target: "http://localhost:8004",
      changeOrigin: true,
      headers: { "X-Service": "uniauth-gf" },
    },
    "/userinfos": {
      target: "http://localhost:8004",
      changeOrigin: true,
      headers: { "X-Service": "uniauth-gf" },
    },
    "/api.json": {
      target: "http://localhost:8004",
      changeOrigin: true,
      headers: { "X-Service": "uniauth-gf" },
    },
    "/swagger": {
      target: "http://localhost:8004",
      changeOrigin: true,
      headers: { "X-Service": "uniauth-gf" },
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
