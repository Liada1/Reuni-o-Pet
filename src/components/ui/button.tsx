import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secundario" | "fantasma" | "perigo";
type Tamanho = "padrao" | "grande";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  tamanho?: Tamanho;
}

const variantes: Record<Variant, string> = {
  primary: "bg-primary text-on-fill hover:bg-primary-hover",
  secundario:
    "bg-surface text-ink border border-border hover:bg-paper",
  fantasma: "text-ink hover:bg-surface",
  perigo: "bg-alert text-on-fill hover:opacity-90",
};

const tamanhos: Record<Tamanho, string> = {
  padrao: "h-11 px-4 text-sm",
  grande: "h-14 px-6 text-base",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", tamanho = "padrao", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-[var(--radius-control)] font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
          variantes[variant],
          tamanhos[tamanho],
          className,
        )}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";
