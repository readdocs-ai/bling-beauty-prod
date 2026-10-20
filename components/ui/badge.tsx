import { cn } from "@/components/utils/cn";

export function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-orange/20 bg-white/60 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-cocoa backdrop-blur",
        className
      )}
    >
      {children}
    </span>
  );
}
