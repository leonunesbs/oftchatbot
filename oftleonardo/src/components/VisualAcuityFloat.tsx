export default function VisualAcuityFloat() {
  return (
    <div className="fixed bottom-6 left-6 z-50">
      <a
        href="/acuidade-visual"
        aria-label="Fazer teste de acuidade visual online"
        className="inline-flex h-11 items-center gap-2 rounded-xl border border-border/70 bg-background/90 px-4 text-sm font-medium text-foreground shadow-md backdrop-blur-sm transition-colors hover:bg-background"
      >
        <span aria-hidden="true">👁️</span>
        <span>Teste de visão</span>
      </a>
    </div>
  );
}
