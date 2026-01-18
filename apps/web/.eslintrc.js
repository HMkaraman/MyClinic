module.exports = {
  extends: ['next/core-web-vitals'],
  rules: {
    // Allow default exports for Next.js pages
    'import/no-default-export': 'off',
    '@next/next/no-html-link-for-pages': 'off',
  },
};
