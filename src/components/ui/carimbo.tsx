import { cn } from "@/lib/utils";

const cores = {
  neutro: "text-ink-muted",
  destaque: "text-accent",
  sucesso: "text-primary",
};

interface CarimboProps {
  texto: string;
  cor?: keyof typeof cores;
  className?: string;
}

export function Carimbo({ texto, cor = "neutro", className }: CarimboProps) {
  return <span className={cn("carimbo", cores[cor], className)}>{texto}</span>;
}
