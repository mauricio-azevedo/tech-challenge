/**
 * `NEXT_PUBLIC_*` e embutido no build pelo Next; o acesso precisa ser literal
 * (`process.env.NEXT_PUBLIC_API_URL`), nao dinamico, para a substituicao acontecer.
 */
export const env = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001',
} as const;
