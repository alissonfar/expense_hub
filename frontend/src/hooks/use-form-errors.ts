import { useState, useCallback } from 'react';
import { processApiError } from '@/lib/error-handler';
import { useToast } from '@/hooks/use-toast';

export const useFormErrors = () => {
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();

  const handleApiError = useCallback((error: unknown) => {
    const processedError = processApiError(error);
    
    // Exibir toast com erro geral
    toast({
      title: processedError.title,
      description: processedError.description,
      variant: 'destructive',
    });

    // Definir erros de campo específicos
    if (processedError.fieldErrors) {
      setFieldErrors(processedError.fieldErrors);
    }
  }, [toast]);

  const clearFieldErrors = useCallback(() => {
    setFieldErrors({});
  }, []);

  const getFieldError = useCallback((fieldName: string) => {
    return fieldErrors[fieldName];
  }, [fieldErrors]);

  return {
    fieldErrors,
    handleApiError,
    clearFieldErrors,
    getFieldError
  };
}; 