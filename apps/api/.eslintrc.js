module.exports = {
  extends: ['@myclinic/config/eslint/nest'],
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
};
