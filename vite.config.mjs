import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

const trimTrailingSlash = (value) => String(value || '').replace(/\/$/, '');

const buildProcessEnv = (mode, rawEnv) => {
  const processEnv = {
    NODE_ENV: mode === 'production' ? 'production' : 'development',
  };

  Object.entries(rawEnv).forEach(([key, value]) => {
    if (key.startsWith('REACT_APP_') || key === 'DEV_PROXY_TARGET' || key === 'PORT') {
      processEnv[key] = value;
    }
  });

  return processEnv;
};

const inferProxyTarget = (env) => {
  const explicitTarget = trimTrailingSlash(env.REACT_APP_API_URL || env.DEV_PROXY_TARGET);
  if (explicitTarget) {
    return explicitTarget;
  }

  const frontendPort = String(env.PORT || '').trim();
  if (frontendPort === '3101') {
    return 'http://localhost:3102';
  }

  return 'http://localhost:3002';
};

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const processEnv = buildProcessEnv(mode, env);
  const frontendPort = Number(env.PORT || 3001);
  const proxyTarget = inferProxyTarget(env);

  return {
    plugins: [
      react({
        include: /\.(js|jsx|ts|tsx)$/,
      }),
    ],
    publicDir: 'public',
    esbuild: {
      loader: 'jsx',
      include: /src\/.*\.[jt]sx?$/,
      exclude: [],
    },
    optimizeDeps: {
      esbuildOptions: {
        loader: {
          '.js': 'jsx',
        },
      },
    },
    define: {
      'process.env': JSON.stringify(processEnv),
    },
    server: {
      host: '0.0.0.0',
      port: frontendPort,
      strictPort: true,
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
          secure: false,
        },
      },
    },
    preview: {
      host: '0.0.0.0',
      port: frontendPort,
      strictPort: true,
    },
    build: {
      outDir: 'build',
      emptyOutDir: true,
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./src/setupTests.js'],
      css: true,
      include: ['src/**/*.test.js'],
    },
  };
});
