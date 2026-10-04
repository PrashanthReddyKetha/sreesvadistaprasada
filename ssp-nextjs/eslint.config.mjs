import nextVitals from 'eslint-config-next/core-web-vitals'

const config = [
  ...nextVitals,
  {
    rules: {
      '@next/next/no-img-element': 'off',
      'react/no-unescaped-entities': 'off',
      'jsx-a11y/alt-text': 'warn',
      'jsx-a11y/anchor-is-valid': 'warn',
      // Rules that arrived with the Next 16 / React 19 lint presets. They flag
      // existing code that works as before; kept visible as warnings until
      // each case is reviewed (see docs/ops FUTURE_WORK_QUEUE).
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/static-components': 'warn',
      'react-hooks/refs': 'warn',
      'react-hooks/purity': 'warn',
      'react-hooks/immutability': 'warn',
      '@next/next/no-html-link-for-pages': 'warn',
    },
  },
  { ignores: ['.next/**', 'node_modules/**', 'public/**', 'next-env.d.ts'] },
]

export default config
