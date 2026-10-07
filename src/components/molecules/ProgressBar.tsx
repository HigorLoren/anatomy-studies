export function ProgressBar({
  current,
  total,
}: {
  current: number;
  total: number;
}) {
  return (
    <div
      class="mt-2 mb-5"
      aria-label={`Questão ${current + 1} de ${total}`}
    >
      <div class="h-[3px] overflow-hidden rounded-full bg-slate-200">
        <div class="h-full rounded-full bg-accent"
          style={{ width: `${((current + 1) / total) * 100}%` }} />
      </div>
    </div>
  );
}
