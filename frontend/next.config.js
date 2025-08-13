/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // Disable SSR for client-only components to prevent hydration issues
  experimental: {
    esmExternals: false,
    // Remove optimizeCss for now
    // optimizeCss: true,
  },

  // Webpack configuration untuk Web3 libraries
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Polyfill untuk Node.js modules
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

    // Fix for RainbowKit SSR issues
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        encoding: false,
      }
    }

    return config
  },

  // Environment variables
  env: {
    NEXT_PUBLIC_ALCHEMY_API_KEY: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY,
    NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID,
    NEXT_PUBLIC_CONTRACT_ADDRESS: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS,
  },

  // Images configuration
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

  // Disable CSS optimization that causes critters issue
  optimizeFonts: false,
  
  // Output configuration
  output: 'standalone',
  
  // Compression
  compress: true,

  // Generate ETags
  generateEtags: true,

  // Fix for SSR hydration issues with crypto-related libraries
  transpilePackages: ['@rainbow-me/rainbowkit'],
}

module.exports = nextConfig