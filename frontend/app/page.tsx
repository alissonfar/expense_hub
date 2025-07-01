"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/stores/auth-store";
import { Button } from "@/components/ui/button";
import { ArrowRight, Building2, Shield, TrendingUp, Users, Zap } from "lucide-react";
import Link from "next/link";

// =============================================
// 🏠 HOMEPAGE COMPONENT
// =============================================

export default function HomePage() {
  const router = useRouter();
  const { user, currentHub, isAuthenticated } = useAuthStore();

  // =============================================
  // 🔄 REDIRECIONAMENTO AUTOMÁTICO
  // =============================================
  
  useEffect(() => {
    if (isAuthenticated && user && currentHub) {
      // Se está autenticado e tem hub selecionado, vai para dashboard
      router.push(`/${currentHub.id}/dashboard`);
    } else if (isAuthenticated && user && !currentHub) {
      // Se está autenticado mas não tem hub selecionado, vai para seleção
      router.push("/select-hub");
    }
  }, [isAuthenticated, user, currentHub, router]);

  // =============================================
  // 🎯 FEATURES DO SISTEMA
  // =============================================

  const features = [
    {
      icon: Building2,
      title: "Multi-Tenant",
      description: "Crie e gerencie múltiplos hubs financeiros com isolamento completo de dados."
    },
    {
      icon: Users,
      title: "Colaborativo",
      description: "Convite membros com diferentes níveis de permissão para gerir finanças em equipe."
    },
    {
      icon: Shield,
      title: "Seguro",
      description: "Autenticação dupla e controle de acesso granular protegem seus dados."
    },
    {
      icon: TrendingUp,
      title: "Relatórios",
      description: "Dashboards inteligentes e relatórios detalhados para tomada de decisão."
    },
    {
      icon: Zap,
      title: "Rápido",
      description: "Interface moderna e responsiva para máxima produtividade."
    }
  ];

  // =============================================
  // 📱 RENDERIZAÇÃO DA LANDING PAGE
  // =============================================

  return (
    <div className="min-h-screen">
      {/* =============================================
          🎨 HERO SECTION
          ============================================= */}
      <section className="relative overflow-hidden py-20 lg:py-32">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-4xl text-center">
            {/* Logo/Brand */}
            <div className="mb-8 flex justify-center">
              <div className="flex items-center space-x-3">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-primary text-white shadow-lg">
                  <Building2 className="h-8 w-8" />
                </div>
                <div className="text-left">
                  <h1 className="text-2xl font-bold text-gradient">
                    Personal Expense Hub
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Gestão Financeira Inteligente
                  </p>
                </div>
              </div>
            </div>

            {/* Headline */}
            <h2 className="mb-6 text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
              Gerencie suas{" "}
              <span className="text-gradient">finanças</span>
              <br />
              em equipe
            </h2>

            {/* Subtitle */}
            <p className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground sm:text-xl">
              Sistema completo de gestão financeira multi-tenant com colaboração 
              em tempo real, relatórios inteligentes e controle total sobre seus dados.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Button
                size="lg"
                className="group h-12 px-8 text-base hover-glow"
                asChild
              >
                <Link href="/auth/login">
                  Entrar
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              
              <Button
                variant="outline"
                size="lg"
                className="h-12 px-8 text-base hover-lift"
                asChild
              >
                <Link href="/auth/register">
                  Criar Conta Grátis
                </Link>
              </Button>
            </div>

            {/* Stats */}
            <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-3">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">100%</div>
                <div className="text-sm text-muted-foreground">Seguro</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">∞</div>
                <div className="text-sm text-muted-foreground">Hubs</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">24/7</div>
                <div className="text-sm text-muted-foreground">Disponível</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =============================================
          ✨ FEATURES SECTION
          ============================================= */}
      <section className="py-20 lg:py-32">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h3 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Por que escolher o{" "}
              <span className="text-gradient">Personal Expense Hub</span>?
            </h3>
            <p className="mt-4 text-lg text-muted-foreground">
              Recursos avançados que fazem a diferença na gestão das suas finanças.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <div
                key={index}
                className="finance-card hover-lift group"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h4 className="mb-2 text-xl font-semibold">
                  {feature.title}
                </h4>
                <p className="text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =============================================
          📞 CTA FINAL SECTION
          ============================================= */}
      <section className="py-20 lg:py-32">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl text-center">
            <h3 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Pronto para começar?
            </h3>
            <p className="mt-4 text-lg text-muted-foreground">
              Junte-se a milhares de usuários que já transformaram sua gestão financeira.
            </p>
            
            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Button
                size="lg"
                className="group h-12 px-8 text-base hover-glow"
                asChild
              >
                <Link href="/auth/register">
                  Começar Agora
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* =============================================
          📄 FOOTER
          ============================================= */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center space-x-2">
              <Building2 className="h-5 w-5 text-primary" />
              <span className="font-semibold">Personal Expense Hub</span>
            </div>
            
            <p className="text-sm text-muted-foreground">
              © 2025 Personal Expense Hub. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
} 