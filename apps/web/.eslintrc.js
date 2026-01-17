module.exports = {
  extends: ['@myclinic/config/eslint/next'],
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
  rules: {
    // Allow default exports for Next.js pages
    'import/no-default-export': 'off',
  },
};
