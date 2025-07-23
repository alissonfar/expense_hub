import { Info, HelpCircle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface InfoTooltipProps {
  title: string;
  description: string;
  icon?: 'info' | 'help';
  size?: 'sm' | 'md';
}

export const InfoTooltip = ({ 
  title, 
  description, 
  icon = 'info',
  size = 'sm' 
}: InfoTooltipProps) => {
  const IconComponent = icon === 'info' ? Info : HelpCircle;
  const iconSize = size === 'sm' ? 14 : 16;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className="inline-flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
          >
            <IconComponent size={iconSize} />
          </button>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <div className="space-y-1">
            <p className="font-medium text-sm">{title}</p>
            <p className="text-xs text-gray-600">{description}</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}; 