import * as React from "react";
import { cn } from "@/components/utils/cn";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        className={cn(
          "h-11 w-full rounded-2xl border border-soft-black/10 bg-white px-4 text-sm",
          "placeholder:text-soft-black/40 shadow-soft",
          "focus:outline-none focus:ring-2 focus:ring-champagne/30 focus:border-soft-black/20",
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";
export default Input;

