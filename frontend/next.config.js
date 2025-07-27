// file frontend/next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // Optimasi untuk production
  experimental: {
    esmExternals: false,
    optimizeCss: true,
  },

  // Konfigurasi untuk Web3 dan blockchain libraries
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Polyfill untuk Node.js modules yang tidak tersedia di browser
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
    }

    // Optimasi untuk Web3 libraries
    config.module.rules.push({
      test: /\.m?js$/,
      resolve: {
        fullySpecified: false,
      },
    })

    // Ignore warnings untuk Web3 dependencies
    config.ignoreWarnings = [
      /Failed to parse source map/,
      /Critical dependency: the request of a dependency is an expression/,
    ]

    // Optimasi bundle splitting
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        '@': __dirname,
      }
    }

    return config
  },

  // Environment variables yang tersedia di client-side
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
    NEXT_PUBLIC_ALCHEMY_API_KEY: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY,
    NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID,
    NEXT_PUBLIC_CONTRACT_ADDRESS: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS,
  },

  // Konfigurasi images
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

  // Headers untuk security
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https:",
              "font-src 'self'",
              "connect-src 'self' https: wss:",
              "frame-src 'none'",
            ].join('; '),
          },
        ],
      },
    ]
  },

  // Redirects
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/',
        permanent: true,
      },
    ]
  },

  // Rewrites untuk API routes
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: '/api/:path*',
      },
    ]
  },

  // Optimasi untuk production
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // Output untuk deployment
  output: 'standalone',
  
  // Optimasi bundle
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },

  // Kompresi
  compress: true,

  // Generate ETags
  generateEtags: true,

  // PWA configuration (optional)
  // withPWA: {
  //   dest: 'public',
  //   register: true,
  //   skipWaiting: true,
  // },
}

module.exports = nextConfig