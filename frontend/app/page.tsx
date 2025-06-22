export default function HomePage() {
  return (
    <main className="container-custom py-8">
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
        <h1 className="text-4xl font-bold text-center">
          💰 Personal Expense Hub
        </h1>
        <p className="text-lg text-muted-foreground text-center max-w-2xl">
          Sistema de controle de gastos pessoais compartilhados com divisão por valores fixos, 
          parcelamento avançado e gestão automática de pagamentos.
        </p>
        <div className="flex gap-4">
          <div className="px-6 py-3 bg-primary text-primary-foreground rounded-lg">
            🚀 Em Desenvolvimento
          </div>
          <div className="px-6 py-3 bg-secondary text-secondary-foreground rounded-lg">
            ⚡ Fase 1: Setup
          </div>
        </div>
        
        <div className="mt-8 p-6 bg-card rounded-lg border shadow-sm max-w-md">
          <h2 className="text-xl font-semibold mb-3">Stack Tecnológica</h2>
          <ul className="space-y-2 text-sm">
            <li>✅ Next.js 14 + React 18</li>
            <li>✅ TypeScript</li>
            <li>✅ Tailwind CSS</li>
            <li>✅ Shadcn/ui (Preparado)</li>
            <li>🔄 Backend API (Em breve)</li>
            <li>🔄 PostgreSQL + Prisma</li>
          </ul>
        </div>
      </div>
    </main>
  );
} 