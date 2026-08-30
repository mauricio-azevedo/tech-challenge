/** @type {import('prettier').Config} */
export default {
  printWidth: 100,
  singleQuote: true,
  trailingComma: 'all',
  semi: true,
  // Ordena classes do Tailwind; sem efeito fora do dashboard.
  plugins: ['prettier-plugin-tailwindcss'],
};
