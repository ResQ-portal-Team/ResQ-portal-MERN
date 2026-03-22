/**
 * Explicit /api proxy for the CRA dev server. The simple "proxy" field in package.json
 * does not reliably forward POST (and other) API calls, which caused 404 on localhost:3000.
 */
const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function setupProxy(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://127.0.0.1:5000',
      changeOrigin: true,
    })
  );
};
