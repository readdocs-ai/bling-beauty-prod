import { cn } from "@/components/utils/cn";
import type { ComponentProps } from "react";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "w-full rounded-xl border border-soft-black/10 bg-white/70 px-4 py-3 text-sm outline-none transition focus:border-soft-black/30 focus:ring-2 focus:ring-champagne/30",
        className
      )}
      {...props}
    />
  );
}
