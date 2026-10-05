export function ProgressBar({
  current,
  total,
}: {
  current: number;
  total: number;
}) {
  return (
    <div
      class="mt-1 mb-6"
      aria-label={`Questão ${current + 1} de ${total}`}
    >
      <div class="h-1 overflow-hidden rounded-full bg-slate-200 sm:hidden">
        <div class="h-full rounded-full bg-accent"
          style={{ width: `${((current + 1) / total) * 100}%` }} />
      </div>
      <div class="hidden gap-2 sm:flex">
        {Array.from({ length: total }, (_, index) => (
          <span
            class={`h-1 min-w-0 flex-1 rounded-full ${index <= current ? "bg-accent" : "bg-slate-200"}`}
          />
        ))}
      </div>
    </div>
  );
}
