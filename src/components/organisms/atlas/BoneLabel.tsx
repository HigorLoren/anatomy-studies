import type { BoneSelection } from "../../../viewer";

export function BoneLabel({ bone }: { bone: BoneSelection | null }) {
  if (!bone) return null;

  return (
    <div class="absolute bottom-5 left-1/2 -translate-x-1/2 w-max max-w-[calc(100%-2rem)] rounded-lg border border-white/20 bg-ink px-4 py-2 text-center text-sm">
      {bone.name}
      {bone.side && (
        <span class="ml-2 text-xs font-normal text-slate-400">
          {bone.side === "D" ? "direito" : "esquerdo"}
        </span>
      )}
    </div>
  );
}
