import { redirect } from 'next/navigation';

/** O dashboard e a listagem; a raiz so redireciona. */
export default function HomePage() {
  redirect('/transactions');
}
