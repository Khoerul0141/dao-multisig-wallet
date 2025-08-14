const webpack = require('webpack');

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    'viem',
    'wagmi',
    '@wagmi/core',
    '@wagmi/connectors',
    '@safe-global/safe-apps-provider',
    '@safe-global/safe-apps-sdk',
    '@rainbow-me/rainbowkit',
    '@tanstack/react-query'
  ],

  reactStrictMode: true,
  swcMinify: true,
  
  experimental: {
    esmExternals: 'loose', // Changed from false to 'loose'
  },

  webpack: (config, { isServer, webpack }) => {
    // Fallback configuration
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      crypto: false,
      os: false,
      path: false,
      stream: false,
      http: false,
      https: false,
      zlib: false,
      url: false,
      util: false,
      buffer: require.resolve('buffer'),
      process: require.resolve('process/browser'),
    };

    // Provide plugin for polyfills
    config.plugins.push(
      new webpack.ProvidePlugin({
        Buffer: ['buffer', 'Buffer'],
        process: 'process/browser',
      })
    );

    // Handle .m?js files
    config.module.rules.push({
      test: /\.m?js$/,
      resolve: {
        fullySpecified: false,
      },
    });

    // Fix for Safe Global SDK import.meta issues
    config.module.rules.push({
      test: /\.js$/,
      include: /node_modules\/@safe-global/,
      type: 'javascript/auto',
      resolve: {
        fullySpecified: false,
      },
    });

    // Add rule for ESM modules
    config.module.rules.push({
      test: /\.(js|mjs)$/,
      include: /node_modules/,
      type: 'javascript/auto',
      resolve: {
        fullySpecified: false,
      },
    });

    // Ignore webpack warnings
    config.ignoreWarnings = [
      /Failed to parse source map/,
      /Critical dependency: the request of a dependency is an expression/,
      /Module not found: Can't resolve/,
      /Can't resolve 'pino-pretty'/,
      /Can't resolve 'lokijs'/,
      /Can't resolve 'encoding'/,
    ];

    // Externals for server-side
    if (!isServer) {
      config.externals = config.externals || [];
      config.externals.push({
        'utf-8-validate': 'commonjs utf-8-validate',
        'bufferutil': 'commonjs bufferutil',
        'encoding': 'commonjs encoding',
      });
    }

    // Alias configuration
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': __dirname,
    };

    return config;
  },

  env: {
    NEXT_PUBLIC_ALCHEMY_API_KEY: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY,
    NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID,
    NEXT_PUBLIC_CONTRACT_ADDRESS: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS,
  },

  images: {
    domains: [
      'localhost',
      'avatar.tobi.sh',
      'cloudflare-ipfs.com',
      'avatars.githubusercontent.com',
    ],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  optimizeFonts: false,
  compress: true,
  generateEtags: true,

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'credentialless',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;