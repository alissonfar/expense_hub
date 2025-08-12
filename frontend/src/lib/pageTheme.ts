export type PageKey =
  | 'dashboard'
  | 'transacoes'
  | 'pagamentos'
  | 'categorias'
  | 'membros'
  | 'relatorios'
  | 'configuracoes'
  | 'perfil'
  | 'auth';

export type PageVariant = 'blue' | 'green' | 'neutral';

const DEFAULT_VARIANT: PageVariant = 'neutral';

export const PAGE_VARIANTS: Record<PageKey, PageVariant> = {
  dashboard: 'blue',
  transacoes: 'green',
  pagamentos: 'blue',
  categorias: 'neutral',
  membros: 'neutral',
  relatorios: 'blue',
  configuracoes: 'neutral',
  perfil: 'neutral',
  auth: 'neutral',
};

export function getPageVariant(page: PageKey): PageVariant {
  return PAGE_VARIANTS[page] ?? DEFAULT_VARIANT;
}
