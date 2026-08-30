/** @type {import('lint-staged').Configuration} */
export default {
  '*.{ts,tsx,js,mjs,cjs}': ['eslint --fix --max-warnings=0', 'prettier --write'],
  '*.{json,md,yml,yaml,css}': ['prettier --write'],
};
