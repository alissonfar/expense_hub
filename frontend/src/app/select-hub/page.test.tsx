import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import SelectHubPage from './page';

// Mock do contexto e hooks
jest.mock('@/hooks/useAuth', () => ({
  useRequirePartialAuth: () => ({
    hubsDisponiveis: [
      { id: 1, nome: 'Hub 1', role: 'PROPRIETARIO' },
      { id: 2, nome: 'Hub 2', role: 'ADMINISTRADOR' }
    ],
    usuario: { nome: 'Usuário Teste' },
    isLoading: false,
    selectHub: jest.fn(() => Promise.resolve()),
    createHub: jest.fn(() => Promise.resolve({ id: 3, nome: 'Novo Hub', role: 'PROPRIETARIO' })),
    logout: jest.fn(() => Promise.resolve()),
    accessToken: 'fake-access-token',
    hubAtual: null,
    toast: jest.fn(),
  })
}));

describe('SelectHubPage', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('@PersonalExpenseHub:refreshToken', 'fake-refresh-token');
  });

  it('renderiza hubs disponíveis e botão de seleção', () => {
    render(<SelectHubPage />);
    expect(screen.getByText('Selecione seu Hub')).toBeInTheDocument();
    expect(screen.getByText('Hub 1')).toBeInTheDocument();
    expect(screen.getByText('Hub 2')).toBeInTheDocument();
    expect(screen.getAllByText('Acessar Hub')[0]).toBeEnabled();
  });

  it('desabilita botão de seleção enquanto isLoading for true', () => {
    jest.spyOn(require('@/hooks/useAuth'), 'useRequirePartialAuth').mockReturnValueOnce({
      hubsDisponiveis: [
        { id: 1, nome: 'Hub 1', role: 'PROPRIETARIO' }
      ],
      usuario: { nome: 'Usuário Teste' },
      isLoading: true,
      selectHub: jest.fn(() => Promise.resolve()),
      createHub: jest.fn(() => Promise.resolve({ id: 3, nome: 'Novo Hub', role: 'PROPRIETARIO' })),
      logout: jest.fn(() => Promise.resolve()),
      accessToken: 'fake-access-token',
      hubAtual: null,
      toast: jest.fn(),
    });
    render(<SelectHubPage />);
    expect(screen.getByText('Acessar Hub')).toBeDisabled();
  });

  it('usa refreshToken do localStorage ao selecionar hub', async () => {
    const selectHubMock = jest.fn(() => Promise.resolve());
    jest.spyOn(require('@/hooks/useAuth'), 'useRequirePartialAuth').mockReturnValueOnce({
      hubsDisponiveis: [
        { id: 1, nome: 'Hub 1', role: 'PROPRIETARIO' }
      ],
      usuario: { nome: 'Usuário Teste' },
      isLoading: false,
      selectHub: selectHubMock,
      createHub: jest.fn(() => Promise.resolve({ id: 3, nome: 'Novo Hub', role: 'PROPRIETARIO' })),
      logout: jest.fn(() => Promise.resolve()),
      accessToken: 'fake-access-token',
      hubAtual: null,
      toast: jest.fn(),
    });
    render(<SelectHubPage />);
    fireEvent.click(screen.getByText('Acessar Hub'));
    await waitFor(() => {
      expect(selectHubMock).toHaveBeenCalledWith(1);
      expect(localStorage.getItem('@PersonalExpenseHub:refreshToken')).toBe('fake-refresh-token');
    });
  });

  it('exibe erro se refreshToken não estiver no localStorage', async () => {
    localStorage.removeItem('@PersonalExpenseHub:refreshToken');
    const toastMock = jest.fn();
    jest.spyOn(require('@/hooks/useAuth'), 'useRequirePartialAuth').mockReturnValueOnce({
      hubsDisponiveis: [
        { id: 1, nome: 'Hub 1', role: 'PROPRIETARIO' }
      ],
      usuario: { nome: 'Usuário Teste' },
      isLoading: false,
      selectHub: jest.fn(() => Promise.resolve()),
      createHub: jest.fn(() => Promise.resolve({ id: 3, nome: 'Novo Hub', role: 'PROPRIETARIO' })),
      logout: jest.fn(() => Promise.resolve()),
      accessToken: 'fake-access-token',
      hubAtual: null,
      toast: toastMock,
    });
    render(<SelectHubPage />);
    fireEvent.click(screen.getByText('Acessar Hub'));
    await waitFor(() => {
      expect(toastMock).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Erro de autenticação',
      }));
    });
  });
}); 