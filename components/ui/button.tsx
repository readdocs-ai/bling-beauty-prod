import Link from "next/link";
import { cn } from "@/components/utils/cn";
import type { ComponentProps } from "react";

type ButtonProps = ComponentProps<"button"> & { variant?: "primary" | "ghost" | "danger" };

export function Button({ className, variant = "primary", ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-orange/30 active:translate-y-[1px]",
        variant === "primary" && "bg-orange-luxe text-white shadow-glow hover:brightness-105",
        variant === "ghost" && "border border-orange/20 bg-white/45 text-soft-black hover:border-orange/35 hover:bg-white/70",
        variant === "danger" && "bg-red-600 text-white shadow-soft hover:opacity-95",
        className
      )}
      {...props}
    />
  );
}

type ButtonLinkProps = ComponentProps<typeof Link> & { variant?: "primary" | "ghost" };

export function ButtonLink({ className, variant = "primary", ...props }: ButtonLinkProps) {
  return (
    <Link
      className={cn(
        "inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-orange/30 active:translate-y-[1px]",
        variant === "primary" && "bg-orange-luxe text-white shadow-glow hover:brightness-105",
        variant === "ghost" && "border border-orange/20 bg-white/45 text-soft-black hover:border-orange/35 hover:bg-white/70",
        className
      )}
      {...props}
    />
  );
}
