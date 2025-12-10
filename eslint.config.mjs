import nextPlugin from 'eslint-config-next'

const config = [
  {
    ignores: [
      'node_modules/**',
      '.next/**',
      'out/**',
      'dist/**',
      'build/**',
      '.cache/**',
      'public/**',
      'coverage/**',
    ],
  },
  ...nextPlugin,
]

export default config
