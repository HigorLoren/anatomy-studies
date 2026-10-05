export function ProgressBar({
  current,
  total,
}: {
  current: number;
  total: number;
}) {
  return (
    <div
      class="mt-1 mb-6 flex gap-2"
      aria-label={`Questão ${current + 1} de ${total}`}
    >
      {Array.from({ length: total }, (_, index) => (
        <span
          class={`h-1 flex-1 rounded-full ${index <= current ? "bg-accent" : "bg-slate-200"}`}
        />
      ))}
    </div>
  );
}
