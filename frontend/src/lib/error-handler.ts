interface ApiError {
  error: string;
  message: string;
  details?: Array<{
    field: string;
    message: string;
  }>;
  timestamp?: string;
}

interface ApiErrorResponse {
  response?: {
    data?: ApiError;
  };
}

export const processApiError = (error: unknown): {
  title: string;
  description: string;
  fieldErrors?: Record<string, string>;
} => {
  const apiErrorResponse = error as ApiErrorResponse;
  const apiError = apiErrorResponse?.response?.data;
  
  if (!apiError) {
    return {
      title: 'Erro inesperado',
      description: 'Ocorreu um erro inesperado. Tente novamente.'
    };
  }

  // Mapear erros específicos
  const errorMap: Record<string, { title: string; description: string }> = {
    'SenhaFraca': {
      title: 'Senha muito fraca',
      description: 'Escolha uma senha mais segura com pelo menos 8 caracteres, incluindo letras maiúsculas, minúsculas, números e caracteres especiais.'
    },
    'SenhaInvalida': {
      title: 'Senha inválida',
      description: apiError.message || 'A senha não atende aos requisitos de segurança.'
    },
    'EmailEmUso': {
      title: 'Email já cadastrado',
      description: 'Este email já está sendo usado por outra conta. Tente fazer login ou use outro email.'
    },
    'DadosInvalidos': {
      title: 'Dados inválidos',
      description: 'Verifique os campos destacados e tente novamente.'
    },
    'CredenciaisInvalidas': {
      title: 'Credenciais inválidas',
      description: 'Email ou senha incorretos. Verifique suas credenciais e tente novamente.'
    },
    'EmailNaoVerificado': {
      title: 'Email não verificado',
      description: 'Verifique seu email e clique no link de ativação antes de fazer login.'
    },
    'ContaBloqueada': {
      title: 'Conta bloqueada',
      description: 'Sua conta foi bloqueada por segurança. Entre em contato com o suporte.'
    },
    'MuitasTentativas': {
      title: 'Muitas tentativas',
      description: 'Muitas tentativas de login. Tente novamente em alguns minutos.'
    },
    'ServicoIndisponivel': {
      title: 'Serviço indisponível',
      description: 'O serviço está temporariamente indisponível. Tente novamente em alguns minutos.'
    }
  };

  const mappedError = errorMap[apiError.error] || {
    title: 'Erro no registro',
    description: apiError.message || 'Ocorreu um erro ao processar sua solicitação.'
  };

  // Processar detalhes de campo se disponíveis
  const fieldErrors: Record<string, string> = {};
  if (apiError.details) {
    apiError.details.forEach(detail => {
      fieldErrors[detail.field] = detail.message;
    });
  }

  return {
    ...mappedError,
    fieldErrors: Object.keys(fieldErrors).length > 0 ? fieldErrors : undefined
  };
}; 