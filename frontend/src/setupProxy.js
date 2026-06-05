const { createProxyMiddleware } = require("http-proxy-middleware");

const target = process.env.PROXY_TARGET || "http://127.0.0.1:8000";

module.exports = function setupProxy(app) {
  app.use(
    "/api",
    createProxyMiddleware({
      target,
      changeOrigin: true,
      pathRewrite: (path) => `/api${path}`,
    })
  );
};
