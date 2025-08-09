module.exports = {
  plugins: {
    // PostCSS Import untuk @import statements
    'postcss-import': {},
    
    // Tailwind CSS
    tailwindcss: {},
    
    // Autoprefixer untuk vendor prefixes
    autoprefixer: {},
    
    // PostCSS Nested untuk nested CSS rules
    'postcss-nested': {},
    
    // PostCSS Custom Properties untuk CSS variables
    'postcss-custom-properties': {
      preserve: false,
    },
    
    // PostCSS Flexbugs Fixes
    'postcss-flexbugs-fixes': {},
    
    // PostCSS Preset Env untuk modern CSS features
    'postcss-preset-env': {
      autoprefixer: {
        flexbox: 'no-2009',
      },
      stage: 3,
      features: {
        'custom-properties': false,
        'nesting-rules': true,
        'custom-media-queries': true,
        'media-query-ranges': true,
        'custom-selectors': true,
        'focus-visible-pseudo-class': true,
        'focus-within-pseudo-class': true,
        'color-functional-notation': true,
        'lab-function': true,
        'oklab-function': true,
        'color-mix': true,
        'cascade-layers': true,
      },
    },
    
    // CSS Nano untuk minifikasi di production
    ...(process.env.NODE_ENV === 'production'
      ? {
          cssnano: {
            preset: [
              'default',
              {
                discardComments: {
                  removeAll: true,
                },
                normalizeWhitespace: true,
                minifySelectors: true,
                minifyParams: true,
                minifyFontValues: true,
                colormin: true,
                convertValues: true,
                discardDuplicates: true,
                discardEmpty: true,
                discardOverridden: true,
                discardUnused: false,
                mergeIdents: false,
                mergeLonghand: true,
                mergeRules: true,
                normalizeCharset: true,
                normalizeDisplayValues: true,
                normalizePositions: true,
                normalizeRepeatStyle: true,
                normalizeString: true,
                normalizeTimingFunctions: true,
                normalizeUnicode: true,
                normalizeUrl: true,
                orderedValues: true,
                reduceIdents: false,
                reduceInitial: true,
                reduceTransforms: true,
                svgo: true,
                uniqueSelectors: true,
              },
            ],
          },
        }
      : {}),
  },
}