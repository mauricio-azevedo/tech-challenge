/** @type {import('prettier').Config} */
export default {
  printWidth: 100,
  singleQuote: true,
  trailingComma: 'all',
  semi: true,
  // Ordena classes do Tailwind; sem efeito fora do dashboard. O stylesheet aponta o tema (v4 e
  // CSS-first) para os tokens customizados (surface, status-*) ordenarem de forma estavel.
  plugins: ['prettier-plugin-tailwindcss'],
  tailwindStylesheet: './apps/web/src/app/globals.css',
  tailwindFunctions: ['cn', 'cva'],
};
