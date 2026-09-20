import { iniciais } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface AvatarProps {
  nome: string;
  fotoUrl?: string | null;
  tamanho?: "sm" | "md" | "lg";
  className?: string;
}

const tamanhos = {
  sm: "h-7 w-7 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-lg",
};

export function Avatar({ nome, fotoUrl, tamanho = "md", className }: AvatarProps) {
  if (fotoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={fotoUrl}
        alt={nome}
        className={cn("rounded-full object-cover", tamanhos[tamanho], className)}
      />
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full bg-primary/10 font-medium text-primary",
        tamanhos[tamanho],
        className,
      )}
      aria-hidden
    >
      {iniciais(nome)}
    </span>
  );
}
