export default function Carregando() {
  return (
    <div className="mx-auto max-w-2xl space-y-4 px-4 py-8" role="status" aria-label="Carregando">
      <div className="h-7 w-48 rounded bg-surface motion-safe:animate-pulse" />
      <div className="h-24 rounded-[var(--radius-panel)] bg-surface motion-safe:animate-pulse" />
      <div className="h-24 rounded-[var(--radius-panel)] bg-surface motion-safe:animate-pulse" />
    </div>
  );
}
