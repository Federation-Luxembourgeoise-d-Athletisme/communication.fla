export function AuthCard({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <div className="flex flex-col gap-2">
          <p className="font-display text-2xl font-bold uppercase leading-none">
            Communication <span className="text-accent">FLA</span>
          </p>
          <div className="lanes w-full" aria-hidden="true" />
        </div>
        <section className="flex flex-col gap-4 rounded-xl border border-line bg-surface p-6">
          <div className="flex flex-col gap-1">
            <h1 className="font-display text-3xl font-semibold leading-tight">{title}</h1>
            {description ? <p className="text-sm text-muted">{description}</p> : null}
          </div>
          {children}
        </section>
      </div>
    </main>
  );
}
