import Link from 'next/link';

export default function HomePage() {
  return (
    <section className="mx-auto max-w-2xl py-16 text-center">
      <h1 className="text-3xl font-semibold tracking-tight">Transações</h1>
      <p className="mt-3 text-slate-600">
        Cada transação nasce pendente e é avaliada pelo antifraude em segundos. Acompanhe o
        resultado aqui.
      </p>
      <div className="mt-8 flex justify-center gap-3">
        <Link
          href="/transactions"
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          Ver transações
        </Link>
        <Link
          href="/transactions/new"
          className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-100"
        >
          Nova transação
        </Link>
      </div>
    </section>
  );
}
