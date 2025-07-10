'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Check, 
  X, 
  Tag, 
  Receipt, 
  UserPlus,
  Sparkles,
  ChevronRight,
  Gift
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  action: string;
  route: string;
  icon: React.ElementType;
  completed: boolean;
}

interface OnboardingChecklistProps {
  isFirstLogin?: boolean;
  onDismiss?: () => void;
}

export function OnboardingChecklist({ isFirstLogin = true, onDismiss }: OnboardingChecklistProps) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(isFirstLogin);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([
    {
      id: 'create-category',
      title: 'Cadastre sua primeira categoria',
      description: 'Organize seus gastos criando categorias como "Alimentação"',
      action: 'Criar categoria',
      route: '/categorias?action=new',
      icon: Tag,
      completed: false,
    },
    {
      id: 'create-transaction',
      title: 'Crie sua primeira transação',
      description: 'Registre um gasto ou receita para começar',
      action: 'Adicionar transação',
      route: '/transacoes?action=new',
      icon: Receipt,
      completed: false,
    },
    {
      id: 'invite-member',
      title: 'Convide um membro',
      description: 'Compartilhe seu Hub com familiares ou amigos',
      action: 'Convidar',
      route: '/membros?action=invite',
      icon: UserPlus,
      completed: false,
    },
  ]);

  const completedCount = checklist.filter(item => item.completed).length;
  const progress = (completedCount / checklist.length) * 100;

  useEffect(() => {
    // Aqui você pode buscar o status real do checklist da API
    // Por exemplo: verificar se já existem categorias, transações, membros
  }, []);

  const handleItemClick = (item: ChecklistItem) => {
    router.push(item.route);
    setShowModal(false);
  };

  const handleDismiss = () => {
    setShowModal(false);
    onDismiss?.();
  };

  const WelcomeModal = () => (
    <Dialog open={showModal} onOpenChange={setShowModal}>
      <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden">
        <div className="bg-gradient-primary p-6 text-white">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <Gift className="h-8 w-8" />
              </div>
              <div>
                <DialogTitle className="text-2xl text-white">
                  Bem-vindo ao Personal Expense Hub!
                </DialogTitle>
                <DialogDescription className="text-white/80 mt-1">
                  Vamos configurar seu Hub em 3 passos simples
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>
        
        <div className="p-6">
          <div className="space-y-4">
            {checklist.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => handleItemClick(item)}
                className={cn(
                  "p-4 rounded-lg border cursor-pointer transition-all duration-200",
                  "hover:shadow-md hover:border-blue-200",
                  item.completed 
                    ? "bg-green-50 border-green-200" 
                    : "bg-white border-gray-200"
                )}
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "p-3 rounded-lg",
                    item.completed 
                      ? "bg-green-100 text-green-600" 
                      : "bg-blue-50 text-blue-600"
                  )}>
                    {item.completed ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <item.icon className="h-5 w-5" />
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{item.title}</h4>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {item.description}
                    </p>
                  </div>
                  
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </div>
              </motion.div>
            ))}
          </div>
          
          <div className="mt-6 pt-6 border-t">
            <Button
              variant="outline"
              className="w-full"
              onClick={handleDismiss}
            >
              Fazer isso depois
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  const ChecklistCard = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="border-blue-100 bg-gradient-to-br from-blue-50/50 to-transparent">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-primary rounded-lg text-white">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg">Primeiros passos</CardTitle>
                <CardDescription>
                  Complete as tarefas para configurar seu Hub
                </CardDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Progresso</span>
                <span className="font-medium">{completedCount} de {checklist.length}</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
            
            <div className="space-y-2">
              {checklist.map((item) => (
                <motion.div
                  key={item.id}
                  whileHover={{ x: 4 }}
                  onClick={() => handleItemClick(item)}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all",
                    "hover:bg-white hover:shadow-sm",
                    item.completed && "opacity-60"
                  )}
                >
                  <div className={cn(
                    "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                    item.completed 
                      ? "bg-green-500 border-green-500" 
                      : "border-gray-300"
                  )}>
                    {item.completed && (
                      <Check className="h-3 w-3 text-white" />
                    )}
                  </div>
                  <span className={cn(
                    "text-sm flex-1",
                    item.completed && "line-through text-muted-foreground"
                  )}>
                    {item.title}
                  </span>
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </motion.div>
              ))}
            </div>
            
            {progress === 100 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-4 bg-green-50 rounded-lg text-center"
              >
                <p className="text-sm font-medium text-green-800">
                  🎉 Parabéns! Você completou todos os primeiros passos!
                </p>
              </motion.div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  return (
    <>
      <AnimatePresence>
        {showModal && <WelcomeModal />}
      </AnimatePresence>
      
      {!showModal && progress < 100 && <ChecklistCard />}
    </>
  );
} 