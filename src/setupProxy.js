const { createProxyMiddleware } = require('http-proxy-middleware');

const trimTrailingSlash = (value) => String(value || '').replace(/\/$/, '');

const inferLocalProxyTarget = () => {
  const explicitTarget = trimTrailingSlash(process.env.REACT_APP_API_URL || process.env.DEV_PROXY_TARGET);
  if (explicitTarget) {
    return explicitTarget;
  }

  const frontendPort = String(process.env.PORT || '').trim();
  if (frontendPort === '3101') {
    return 'http://localhost:3102';
  }

  return 'http://localhost:3002';
};

module.exports = function setupProxy(app) {
  const target = inferLocalProxyTarget();

  app.use(
    '/api',
    createProxyMiddleware({
      target,
      changeOrigin: true,
      secure: false,
      logLevel: 'silent',
    })
  );
};
