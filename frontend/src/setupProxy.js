const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function (app) {
  const apiProxy = createProxyMiddleware({
    target: 'http://localhost:5050',
    changeOrigin: true,
  });

  app.use(['/auth', '/profiles', '/matches'], (req, res, next) => {
    if (req.headers.accept?.includes('application/json')) {
      return apiProxy(req, res, next);
    }
    next();
  });
};
