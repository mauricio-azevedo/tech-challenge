/** Estado de carregamento anunciado a tecnologia assistiva; o esqueleto e so decoracao. */
export function LoadingState({ label, rows = 5 }: { label: string; rows?: number }) {
  return (
    <div role="status" aria-live="polite" aria-busy="true" className="space-y-3">
      <span className="sr-only">{label}</span>
      {Array.from({ length: rows }, (_, index) => (
        <div
          key={index}
          aria-hidden="true"
          className="h-10 animate-pulse rounded-md bg-slate-200"
        />
      ))}
    </div>
  );
}
