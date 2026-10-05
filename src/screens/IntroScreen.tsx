export function IntroScreen({ onStart }: { onStart: () => void }) {
  return (
    <>
      <div class="flex items-center justify-center overflow-hidden rounded-3xl bg-[#0a0d14] p-8">
        <img
          class="w-full max-w-110"
          src={`${import.meta.env.BASE_URL}skull-practice.png`}
          alt="Crânio humano visto de frente e de lado"
        />
      </div>
      <section class="flex items-center">
        <div class="w-full">
          <span class="mb-5 block text-sm font-medium text-accent">
            Prática de anatomia
          </span>
          <h1 class="mb-5 text-[clamp(2rem,3.2vw,3rem)] leading-[1.13] font-medium tracking-[-0.045em]">
            Um novo olhar
            <br />
            sobre o crânio.
          </h1>
          <p class="max-w-lg text-[16px] leading-7 text-muted">
            Observe, identifique e descubra o que você já sabe sobre as
            estruturas da cabeça.
          </p>
          <div class="mt-3 flex flex-wrap items-end gap-x-6 gap-y-3 border-b border-slate-200 py-4 text-sm text-muted">
            <span>
              <strong class="mr-1 text-lg font-medium text-ink">5</strong>{" "}
              questões
            </span>
            <span>
              <strong class="mr-1 text-lg font-medium text-ink">3</strong>{" "}
              formas de praticar
            </span>
            <span>Sem limite de tempo</span>
          </div>
          <div class="my-8 space-y-4">
            <p class="grid grid-cols-[36px_1fr] gap-x-3">
              <span class="row-span-2 pt-1 text-xl text-accent">01</span>
              <b class="text-sm font-medium">Identifique no modelo</b>
              <small class="mt-1 text-sm leading-5 text-muted">
                Associe estruturas aos pontos numerados.
              </small>
            </p>
            <p class="grid grid-cols-[36px_1fr] gap-x-3">
              <span class="row-span-2 pt-1 text-xl text-accent">02</span>
              <b class="text-sm font-medium">Dê nome às estruturas</b>
              <small class="mt-1 text-sm leading-5 text-muted">
                Reconheça os ossos destacados em 3D.
              </small>
            </p>
            <p class="grid grid-cols-[36px_1fr] gap-x-3">
              <span class="row-span-2 pt-1 text-xl text-accent">03</span>
              <b class="text-sm font-medium">Complete a frase</b>
              <small class="mt-1 text-sm leading-5 text-muted">
                Conecte os nomes ao que você aprendeu.
              </small>
            </p>
          </div>
          <button
            class="font-[inherit] cursor-pointer transition-colors disabled:cursor-default disabled:opacity-45 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent mt-6 flex min-h-14 items-center justify-between rounded-xl bg-ink px-5 py-4 text-sm font-medium text-white hover:bg-accent disabled:hover:bg-ink"
            onClick={onStart}
          >
            Começar a prática
          </button>
        </div>
      </section>
    </>
  );
}
