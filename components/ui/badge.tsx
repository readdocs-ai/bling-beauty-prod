import { cn } from "@/components/utils/cn";

export function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full border border-soft-black/10 bg-ivory/80 px-3 py-1 text-xs font-medium text-soft-black backdrop-blur", className)}>
      {children}
    </span>
  );
}
