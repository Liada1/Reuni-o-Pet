import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Surface({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-panel)] border border-border bg-surface",
        className,
      )}
      {...props}
    />
  );
}
