'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Building2, 
  Users, 
  Sparkles, 
  ArrowRight, 
  Loader2,
  Home,
  Briefcase,
  UserPlus
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

// Ícones por tipo de hub
const hubIcons: Record<string, React.ReactNode> = {
  pessoal: <Home className="w-6 h-6" />,
  trabalho: <Briefcase className="w-6 h-6" />,
  compartilhado: <Users className="w-6 h-6" />,
  default: <Building2 className="w-6 h-6" />
};

// Cores por role
const roleColors: Record<string, string> = {
  PROPRIETARIO: "bg-gradient-to-r from-blue-600 to-blue-700 text-white",
  ADMINISTRADOR: "bg-gradient-to-r from-blue-500 to-blue-600 text-white",
  COLABORADOR: "bg-gradient-to-r from-blue-400 to-blue-500 text-white",
  VISUALIZADOR: "bg-gradient-to-r from-blue-300 to-blue-400 text-white"
};

// Traduções de roles
const roleTranslations: Record<string, string> = {
  PROPRIETARIO: "Proprietário",
  ADMINISTRADOR: "Administrador",
  COLABORADOR: "Colaborador",
  VISUALIZADOR: "Visualizador"
};

export default function SelectHubPage() {
  const [selectedHubId, setSelectedHubId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { hubsDisponiveis, selectHub, isLoading: authLoading } = useAuth();

  // Redireciona se não houver hubs disponíveis
  useEffect(() => {
    if (!authLoading && (!hubsDisponiveis || hubsDisponiveis.length === 0)) {
      router.push('/login');
    }
  }, [hubsDisponiveis, authLoading, router]);

  const handleSelectHub = async (hubId: number) => {
    try {
      setSelectedHubId(hubId);
      setIsLoading(true);
      
      await selectHub(hubId);
      
      toast({
        title: 'Hub selecionado com sucesso!',
        description: 'Redirecionando para o dashboard...',
      });
      
      router.push('/dashboard');
    } catch (error: any) {
      toast({
        title: 'Erro ao selecionar Hub',
        description: error.response?.data?.message || 'Ocorreu um erro ao selecionar o Hub.',
        variant: 'destructive',
      });
      setSelectedHubId(null);
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-subtle">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle relative overflow-hidden">
      {/* Background animado */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -inset-[10px] opacity-30">
          <div className="absolute top-1/4 -left-20 w-[500px] h-[500px] bg-blue-400 rounded-full mix-blend-multiply filter blur-2xl opacity-50 animate-blob"></div>
          <div className="absolute top-1/3 -right-20 w-[500px] h-[500px] bg-blue-300 rounded-full mix-blend-multiply filter blur-2xl opacity-50 animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-1/4 left-1/2 w-[500px] h-[500px] bg-blue-500 rounded-full mix-blend-multiply filter blur-2xl opacity-50 animate-blob animation-delay-4000"></div>
        </div>
      </div>

      {/* Container principal */}
      <div className="relative z-10 container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto"
        >
          {/* Header */}
          <div className="text-center mb-12">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
              className="inline-flex items-center justify-center w-20 h-20 bg-gradient-primary rounded-3xl mb-6 shadow-xl"
            >
              <Sparkles className="w-10 h-10 text-white" />
            </motion.div>
            <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-4">
              Selecione seu Hub
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Escolha o espaço onde deseja gerenciar suas finanças. Você pode alternar entre hubs a qualquer momento.
            </p>
          </div>

          {/* Grid de Hubs */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {hubsDisponiveis.map((hub, index) => {
              const isSelected = selectedHubId === hub.id;
              const hubType = hub.nome.toLowerCase().includes('pessoal') 
                ? 'pessoal' 
                : hub.nome.toLowerCase().includes('trabalho')
                ? 'trabalho'
                : hub.membros > 1
                ? 'compartilhado'
                : 'default';
              
              return (
                <motion.div
                  key={hub.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <Card 
                    className={`
                      glass-card border-0 shadow-lg hover-lift cursor-pointer transition-all duration-300
                      ${isSelected ? 'ring-2 ring-primary shadow-xl' : 'hover:shadow-xl'}
                    `}
                    onClick={() => handleSelectHub(hub.id)}
                  >
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="p-3 rounded-xl bg-gradient-primary/10 text-primary">
                          {hubIcons[hubType] || hubIcons.default}
                        </div>
                        <Badge 
                          variant="secondary" 
                          className={roleColors[hub.role]}
                        >
                          {roleTranslations[hub.role]}
                        </Badge>
                      </div>
                      <CardTitle className="text-xl font-semibold">
                        {hub.nome}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-4 mt-2">
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {hub.membros} {hub.membros === 1 ? 'membro' : 'membros'}
                        </span>
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button
                        className={`
                          w-full h-11 transition-all duration-300
                          ${isSelected 
                            ? 'btn-gradient' 
                            : 'bg-blue-50 hover:bg-blue-100 text-blue-700'
                          }
                        `}
                        disabled={isLoading}
                      >
                        {isLoading && isSelected ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Acessando...
                          </>
                        ) : (
                          <>
                            {isSelected ? 'Acessando Hub' : 'Selecionar Hub'}
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}

            {/* Card para criar novo hub */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: hubsDisponiveis.length * 0.1 }}
            >
              <Card className="glass-card border-2 border-dashed border-blue-300 hover:border-blue-400 transition-colors cursor-pointer h-full">
                <CardHeader className="h-full flex flex-col items-center justify-center text-center py-12">
                  <div className="p-4 rounded-full bg-blue-50 text-blue-600 mb-4">
                    <UserPlus className="w-8 h-8" />
                  </div>
                  <CardTitle className="text-lg text-muted-foreground">
                    Criar Novo Hub
                  </CardTitle>
                  <CardDescription>
                    Crie um novo espaço para gerenciar suas finanças
                  </CardDescription>
                </CardHeader>
              </Card>
            </motion.div>
          </div>

          {/* Footer info */}
          <div className="mt-12 text-center">
            <p className="text-sm text-muted-foreground">
              Dica: Você pode alternar entre hubs a qualquer momento usando o seletor no menu principal.
            </p>
          </div>
        </motion.div>
      </div>

      {/* Estilos para animações */}
      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
} 