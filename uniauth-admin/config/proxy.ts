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
  // dev: {
  //   '/api/': {
  //     target: 'http://localhost:8000',
  //     changeOrigin: true,
  //     pathRewrite: { '^/api/': '/api/' },
  //     secure: false, // 禁用SSL验证
  //   },
  // },
  test: {
    '/api/': {
      target: 'http://localhost:9090',
      changeOrigin: true,
      pathRewrite: { '^/api/': '/api/' },
    },
  },
  pre: {
    '/api/': {
      target: 'http://localhost:9090',
      changeOrigin: true,
      pathRewrite: { '^/api/': '/api/' },
    },
  },
};
