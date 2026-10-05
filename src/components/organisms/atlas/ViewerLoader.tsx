import type { ViewerStatus } from "../../../viewer";

type ViewerLoaderProps = { status: ViewerStatus; onRetry: () => void };

export function ViewerLoader({ status, onRetry }: ViewerLoaderProps) {
  if (status === "ready") return null;

  return (
    <div
      class="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[#0a0d14] px-5 text-center text-sm text-slate-300"
      role={status === "error" ? "alert" : "status"}
    >
      {status === "loading" ? (
        <>
          <span class="size-6 animate-spin rounded-full border-2 border-slate-600 border-t-white motion-reduce:animate-none" />
          Preparando o crânio…
        </>
      ) : (
        <>
          Não foi possível abrir o modelo.
          <button
            class="font-[inherit] cursor-pointer transition-colors disabled:cursor-default disabled:opacity-45 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent rounded-lg border border-slate-500 px-4 py-2"
            onClick={onRetry}
          >
            Tentar novamente
          </button>
        </>
      )}
    </div>
  );
}
