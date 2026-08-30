'use client';

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: (() => void) | undefined;
}) {
  return (
    <div
      role="alert"
      className="rounded-lg border border-rose-200 bg-rose-50 p-6 text-center text-rose-900"
    >
      <p className="font-medium">Algo deu errado</p>
      <p className="mt-1 text-sm">{message}</p>
      {onRetry !== undefined && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 rounded-md bg-rose-700 px-4 py-2 text-sm font-medium text-white hover:bg-rose-600"
        >
          Tentar novamente
        </button>
      )}
    </div>
  );
}
