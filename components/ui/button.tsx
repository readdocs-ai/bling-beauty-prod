import * as React from "react";
import Link from "next/link";
import { cn } from "@/components/utils/cn";

type Variant = "default" | "ghost";

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
};

const base =
  "inline-flex items-center justify-center rounded-2xl px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-champagne/30 disabled:opacity-50 disabled:pointer-events-none";

const variants: Record<Variant, string> = {
  default:
    "bg-soft-black text-white shadow-soft hover:opacity-95 active:opacity-90",
  ghost:
    "bg-transparent text-current hover:bg-current/5 shadow-none active:opacity-90",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", type = "button", ...props }, ref) => {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(base, variants[variant], className)}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";

type ButtonLinkProps = React.ComponentProps<typeof Link> & {
  className?: string;
  children: React.ReactNode;
  variant?: Variant;
};

export function ButtonLink({
  className,
  children,
  variant = "default",
  ...props
}: ButtonLinkProps) {
  return (
    <Link className={cn(base, variants[variant], className)} {...props}>
      {children}
    </Link>
  );
}

// Optional: allows default import too
export default Button;