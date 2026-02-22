import { cn } from "@/components/utils/cn";
import type { ComponentProps } from "react";

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(
        "min-h-[120px] w-full resize-y rounded-xl border border-soft-black/10 bg-white/70 px-4 py-3 text-sm outline-none transition focus:border-soft-black/30 focus:ring-2 focus:ring-champagne/30",
        className
      )}
      {...props}
    />
  );
}
