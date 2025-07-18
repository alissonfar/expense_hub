# Refatoração do Fluxo Multi-Hub: Documento de Implementação

## 1. Fluxo e Lógica Atual

### 1.1 Autenticação e Seleção de Hub
- O usuário realiza login com email e senha.
- Após login, recebe um refreshToken e uma lista de hubs disponíveis.
- O usuário seleciona um hub (select-hub), recebendo um accessToken específico para aquele hub.
- O contexto do hub selecionado é salvo em localStorage, cookies e no estado React (AuthContext).
- O sistema redireciona para o dashboard do hub selecionado.

### 1.2 Troca de Hub
- O usuário pode acessar a página `/select-hub` para trocar de hub.
- Ao selecionar um novo hub, o contexto é atualizado e o usuário é redirecionado para o dashboard.
- O botão de troca de hub está disponível no Header, levando para `/select-hub`.

### 1.3 Múltiplos Logins/Sessões
- O usuário pode abrir múltiplas abas ou navegadores e realizar login/troca de hub independentemente em cada um.
- O contexto (tokens, hubAtual) é salvo em localStorage/cookies, mas não há sincronização automática entre abas.

### 1.4 Sincronização de Estado
- O estado do hub selecionado é mantido em localStorage, cookies e no estado React.
- Não há mecanismo para propagar mudanças de contexto (troca de hub/logout) entre abas abertas.

### 1.5 Validação de Contexto
- O backend valida tokens JWT e o contexto do hub em cada requisição protegida.
- O frontend assume que o contexto local está sempre correto, exceto após reload.

---

## 2. Pontos de Validação e Onde Ocorrem

### 2.1 Autenticação do Usuário
- **Frontend:**
  - Valida se o usuário está autenticado via tokens no localStorage/cookies/contexto React.
  - Middleware do Next.js verifica tokens nos cookies para proteger rotas.
- **Backend:**
  - Valida refreshToken e accessToken em cada requisição protegida.
  - Gera novos tokens após login e seleção de hub.

### 2.2 Seleção e Troca de Hub
- **Frontend:**
  - Salva hub selecionado em localStorage, cookies e contexto React.
  - Middleware verifica se há hub selecionado para permitir acesso a rotas protegidas.
  - Página `/select-hub` permite trocar de hub e atualiza o contexto.
- **Backend:**
  - Valida se o usuário pertence ao hub selecionado ao gerar accessToken.
  - Garante que o accessToken corresponde ao hub correto em cada requisição.

### 2.3 Sincronização de Estado
- **Frontend:**
  - Atualiza localStorage, cookies e contexto React ao trocar de hub ou deslogar.
  - Não há sincronização automática entre múltiplas abas.
- **Backend:**
  - Não realiza sincronização entre sessões do mesmo usuário.

### 2.4 Múltiplos Logins/Sessões
- **Frontend:**
  - Permite múltiplos logins/trocas de hub em diferentes abas, mas sem isolamento ou sincronização.
- **Backend:**
  - Cada requisição é validada individualmente pelo token enviado.

### 2.5 Logout
- **Frontend:**
  - Limpa tokens, contexto e cookies ao deslogar.
  - Não propaga logout para outras abas.
- **Backend:**
  - Não mantém estado de sessão (stateless/JWT), apenas responde ao logout.

---

## 3. Problemas e Riscos do Modelo Atual

### 3.1 Autenticação do Usuário
- **Problemas:**
  - Possível divergência entre cookies/localStorage/contexto React, especialmente após múltiplos logins ou trocas rápidas.
  - Middleware pode tomar decisões diferentes do client devido a timing ou diferença de cookies.
- **Riscos:**
  - Usuário pode ser redirecionado incorretamente ou ficar "preso" em uma rota.
  - Sessão pode ser considerada ativa em uma aba e expirada em outra.

### 3.2 Seleção e Troca de Hub
- **Problemas:**
  - Troca de hub não é propagada entre abas, causando inconsistência de contexto.
  - Ações podem ser executadas no hub errado se o contexto não for atualizado a tempo.
  - Não há bloqueio de ações durante a troca de hub (race condition).
- **Riscos:**
  - Usuário pode editar dados do hub errado sem perceber.
  - Possível corrupção de dados ou exposição de informações.

### 3.3 Sincronização de Estado
- **Problemas:**
  - Mudanças de contexto (troca de hub/logout) não são propagadas entre abas.
  - Estado local pode ficar "desatualizado" em abas inativas.
- **Riscos:**
  - Ações em abas diferentes podem afetar hubs diferentes sem o usuário perceber.
  - Logout em uma aba não desloga as demais, mantendo sessão ativa indevidamente.

### 3.4 Múltiplos Logins/Sessões
- **Problemas:**
  - Não há isolamento entre sessões em diferentes abas ou navegadores.
  - Login/troca de hub em uma aba pode sobrescrever contexto de outra.
- **Riscos:**
  - Confusão de contexto, exposição de dados, ações não intencionais.
  - Possível exploração por usuários maliciosos.

### 3.5 Logout
- **Problemas:**
  - Logout não é propagado para outras abas.
  - Sessão pode permanecer ativa em abas inativas.
- **Riscos:**
  - Falha de segurança: usuário pode continuar operando em uma aba mesmo após logout em outra.

---

## 4. Mudanças Propostas e Justificativas

### 4.1 Autenticação do Usuário
- **Mudança:** Unificar a validação de tokens/contexto entre client e middleware, garantindo que ambos leiam e atualizem os cookies/localStorage de forma consistente.
- **Justificativa:** Evitar divergências de estado e redirecionamentos inesperados.
- **Impacto:** Usuário terá experiência mais previsível e segura ao navegar/logar.

### 4.2 Seleção e Troca de Hub
- **Mudança:**
  - Permitir acesso irrestrito à página `/select-hub` para usuários autenticados, mesmo já tendo um hub selecionado.
  - Implementar modal de troca de hub (além da página), permitindo troca rápida sem reload.
  - Bloquear ações do usuário durante a troca de hub até o novo contexto estar carregado.
- **Justificativa:**
  - Usuário pode querer criar/trocar de hub a qualquer momento.
  - Evitar race conditions e garantir que ações sejam sempre executadas no contexto correto.
- **Impacto:**
  - Troca de hub mais fluida, segura e sem riscos de inconsistência.

### 4.3 Sincronização de Estado
- **Mudança:**
  - Usar o evento `storage` do navegador para propagar mudanças de contexto (troca de hub/logout) entre todas as abas abertas.
  - Ao detectar mudança relevante, recarregar o contexto ou forçar reload da aba.
- **Justificativa:**
  - Garantir que todas as abas reflitam o estado mais recente do usuário.
- **Impacto:**
  - Reduz drasticamente o risco de inconsistência e ações em contexto errado.

### 4.4 Múltiplos Logins/Sessões
- **Mudança:**
  - Sempre sobrescrever tokens/contexto ao trocar de hub/login.
  - (Opcional) Implementar isolamento de sessão por aba (ex: via sessionStorage) se o modelo de negócio exigir.
- **Justificativa:**
  - Evitar sobrescrita acidental de contexto e confusão do usuário.
- **Impacto:**
  - Sessões mais seguras e previsíveis, menor risco de exposição de dados.

### 4.5 Logout
- **Mudança:**
  - Propagar logout para todas as abas usando o evento `storage`.
  - Limpar tokens/contexto/cookies de forma atômica e sincronizada.
- **Justificativa:**
  - Garantir que o logout seja efetivo em todas as sessões abertas.
- **Impacto:**
  - Elimina falhas de segurança e mantém a experiência do usuário consistente.

---

## 5. Resultado Final Esperado

### 5.1 Fluxos de Navegação
- **Login:**
  - Após login, usuário é sempre direcionado para `/select-hub`, mesmo que só tenha um hub.
  - Usuário pode criar novo hub ou selecionar um existente.
- **Troca de Hub:**
  - Usuário pode acessar `/select-hub` a qualquer momento (via botão/header ou manualmente).
  - Modal de troca rápida disponível no header para alternar hubs sem reload.
  - Após selecionar novo hub, contexto é atualizado e usuário pode ser redirecionado para dashboard ou página anterior.
- **Logout:**
  - Logout em qualquer aba propaga para todas as abas abertas.
  - Todos os tokens/contextos são limpos de forma atômica.

### 5.2 Regras de Negócio
- **Acesso à /select-hub:**
  - Permitido para qualquer usuário autenticado, independentemente do hub selecionado.
- **Middleware:**
  - Ordem de checagem: `authOnlyRoutes` > `protectedRoutes` > `publicRoutes` > `openRoutes`.
  - `/select-hub` nunca redireciona automaticamente para `/dashboard`.
- **Sincronização:**
  - Mudanças de contexto (troca de hub/logout) propagadas entre abas via evento `storage`.
- **Validação Backend:**
  - Toda requisição protegida valida se o accessToken corresponde ao hub/contexto correto.

### 5.3 Exemplos de Código/UX

#### Exemplo: Sincronização entre abas
```js
window.addEventListener('storage', (event) => {
  if ([
    '@PersonalExpenseHub:hubAtual',
    '@PersonalExpenseHub:accessToken',
    '@PersonalExpenseHub:refreshToken'
  ].includes(event.key)) {
    window.location.reload();
  }
});
```

#### Exemplo: Modal de troca de hub
- Botão no header abre modal com lista de hubs disponíveis.
- Seleção de novo hub atualiza contexto e fecha modal.
- Exibe toast/snackbar: "Hub alterado com sucesso!"

#### Exemplo: Middleware Next.js
```js
if (isAuthOnlyRoute) {
  if (!isAuthenticated) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  // Permitir acesso SEMPRE à /select-hub
  return NextResponse.next();
}
```

### 5.4 Checklist de Validação
- [ ] Acesso manual e via botão à `/select-hub` sempre permitido para autenticados
- [ ] Troca de hub propaga para todas as abas
- [ ] Logout propaga para todas as abas
- [ ] Middleware nunca redireciona de `/select-hub` para `/dashboard`
- [ ] Backend valida contexto de hub em todas as requisições
- [ ] Feedback visual claro em todas as trocas de contexto
- [ ] Testes E2E cobrindo múltiplos logins, trocas rápidas e logout global

---

**Fim do documento de refatoração multi-hub.** 