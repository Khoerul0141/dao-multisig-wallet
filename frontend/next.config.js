/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // FIXED: Disable SSR for client-only components to prevent hydration issues
  experimental: {
    esmExternals: false,
  },

  // FIXED: Webpack configuration untuk Web3 libraries
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // FIXED: Polyfill untuk Node.js modules
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
    }

    // FIXED: Provide global Buffer polyfill
    config.plugins.push(
      new webpack.ProvidePlugin({
        Buffer: ['buffer', 'Buffer'],
        process: 'process/browser',
      })
    )

    // FIXED: Optimasi untuk Web3 libraries
    config.module.rules.push({
      test: /\.m?js$/,
      resolve: {
        fullySpecified: false,
      },
    })

    // FIXED: Ignore warnings untuk Web3 dependencies
    config.ignoreWarnings = [
      /Failed to parse source map/,
      /Critical dependency: the request of a dependency is an expression/,
      /Module not found: Can't resolve/,
    ]

    // FIXED: Handle ESM modules properly
    config.externals = config.externals || []
    if (!isServer) {
      config.externals.push({
        'utf-8-validate': 'commonjs utf-8-validate',
        'bufferutil': 'commonjs bufferutil',
      })
    }

    return config
  },

  // Environment variables
  env: {
    NEXT_PUBLIC_ALCHEMY_API_KEY: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY,
    NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID,
    NEXT_PUBLIC_CONTRACT_ADDRESS: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS,
  },

  // FIXED: Images configuration
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

  // FIXED: Disable problematic optimizations
  optimizeFonts: false,
  
  // FIXED: Output configuration
  output: 'standalone',
  
  // Compression
  compress: true,

  // Generate ETags
  generateEtags: true,

  // FIXED: Transpile packages that cause issues
  transpilePackages: [
    '@rainbow-me/rainbowkit',
    'wagmi',
    'viem',
    '@tanstack/react-query'
  ],

  // FIXED: Additional configuration for better Web3 support
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
    ]
  },
}

module.exports = nextConfig