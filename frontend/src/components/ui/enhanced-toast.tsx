import { useToast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';
import { Check, X, Info, AlertTriangle, Users, DollarSign, Settings, User, Shield } from 'lucide-react';

interface EnhancedToastProps {
  title: string;
  description?: string;
  variant?: 'default' | 'destructive' | 'success' | 'warning' | 'info';
  icon?: React.ReactNode;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const useEnhancedToast = () => {
  const { toast } = useToast();

  const getContextualIcon = (title: string, variant?: string) => {
    const lowerTitle = title.toLowerCase();
    
    // Ícones contextuais baseados no título
    if (lowerTitle.includes('hub') || lowerTitle.includes('grupo')) {
      return <Users className="h-5 w-5" />;
    }
    if (lowerTitle.includes('transação') || lowerTitle.includes('pagamento') || lowerTitle.includes('despesa')) {
      return <DollarSign className="h-5 w-5" />;
    }
    if (lowerTitle.includes('configuração') || lowerTitle.includes('configuração')) {
      return <Settings className="h-5 w-5" />;
    }
    if (lowerTitle.includes('perfil') || lowerTitle.includes('usuário')) {
      return <User className="h-5 w-5" />;
    }
    if (lowerTitle.includes('convite') || lowerTitle.includes('membro')) {
      return <Users className="h-5 w-5" />;
    }
    if (lowerTitle.includes('login') || lowerTitle.includes('autenticação') || lowerTitle.includes('segurança')) {
      return <Shield className="h-5 w-5" />;
    }
    
    // Fallback para variantes
    switch (variant) {
      case 'success':
        return <Check className="h-5 w-5" />;
      case 'destructive':
        return <X className="h-5 w-5" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5" />;
      case 'info':
        return <Info className="h-5 w-5" />;
      default:
        return <Check className="h-5 w-5" />;
    }
  };

  const showToast = ({
    title,
    description,
    variant = 'default',
    icon,
    duration = 5000,
    action
  }: EnhancedToastProps) => {
    const contextualIcon = icon || getContextualIcon(title, variant);
    
    toast({
      title,
      description,
      variant,
      icon: contextualIcon,
      duration,
      action: action ? (
        <ToastAction altText={action.label} onClick={action.onClick}>
          {action.label}
        </ToastAction>
      ) : undefined,
    });
  };

  const showSuccess = (title: string, description?: string) => {
    showToast({ title, description, variant: 'success' });
  };

  const showError = (title: string, description?: string) => {
    showToast({ title, description, variant: 'destructive' });
  };

  const showWarning = (title: string, description?: string) => {
    showToast({ title, description, variant: 'warning' });
  };

  const showInfo = (title: string, description?: string) => {
    showToast({ title, description, variant: 'info' });
  };

  return {
    showToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };
}; 