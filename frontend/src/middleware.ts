import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Rotas que requerem autenticação completa (login + seleção de hub)
const protectedRoutes = [
  '/dashboard',
  '/transacoes',
  '/pessoas',
  '/tags',
  '/pagamentos',
  '/relatorios',
  '/configuracoes'
];

// Rotas que requerem apenas login (sem seleção de hub)
const authOnlyRoutes = [
  '/select-hub'
];

// Rotas públicas (apenas para usuários não autenticados)
const publicRoutes = [
  '/login',
  '/register',
  '/ativar-convite'
];

// Rotas completamente públicas (acessíveis sempre)
const openRoutes = [
  '/',
  '/sobre',
  '/contato',
  '/politica-privacidade',
  '/termos-uso'
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Verificar se é uma rota de API ou arquivos estáticos
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/static/') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Obter tokens dos cookies
  const accessToken = request.cookies.get('@PersonalExpenseHub:accessToken')?.value;
  const refreshToken = request.cookies.get('@PersonalExpenseHub:refreshToken')?.value;
  const hubAtual = request.cookies.get('@PersonalExpenseHub:hubAtual')?.value;
  
  // Verificar se usuário está autenticado
  const isAuthenticated = Boolean(accessToken && refreshToken);
  const hasSelectedHub = Boolean(hubAtual);
  
  // Verificar se a rota atual é protegida
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  );
  
  const isAuthOnlyRoute = authOnlyRoutes.some(route => 
    pathname.startsWith(route)
  );
  
  const isPublicRoute = publicRoutes.some(route => 
    pathname.startsWith(route)
  );
  
  const isOpenRoute = openRoutes.some(route => 
    pathname === route || pathname.startsWith(route)
  );

  // Lógica de redirecionamento

  // 1. Rotas protegidas - requer autenticação completa
  if (isProtectedRoute) {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    
    if (!hasSelectedHub) {
      return NextResponse.redirect(new URL('/select-hub', request.url));
    }
    
    // Usuário autenticado e com hub selecionado - permitir acesso
    return NextResponse.next();
  }

  // 2. Rotas que requerem apenas login
  if (isAuthOnlyRoute) {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    
    // Se já selecionou hub, redirecionar para dashboard
    if (hasSelectedHub && pathname === '/select-hub') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    
    // Usuário autenticado mas sem hub - permitir acesso
    return NextResponse.next();
  }

  // 3. Rotas públicas (apenas para não autenticados)
  if (isPublicRoute) {
    if (isAuthenticated) {
      // Se já tem hub, ir para dashboard
      if (hasSelectedHub) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
      // Se não tem hub, ir para seleção
      return NextResponse.redirect(new URL('/select-hub', request.url));
    }
    
    // Usuário não autenticado - permitir acesso
    return NextResponse.next();
  }

  // 4. Rotas completamente públicas
  if (isOpenRoute) {
    return NextResponse.next();
  }

  // 5. Rota raiz - redirecionar baseado no estado
  if (pathname === '/') {
    if (isAuthenticated) {
      if (hasSelectedHub) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
      return NextResponse.redirect(new URL('/select-hub', request.url));
    }
    
    // Usuário não autenticado - ir para login
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 6. Rotas não definidas - redirecionar para página apropriada
  if (isAuthenticated) {
    if (hasSelectedHub) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.redirect(new URL('/select-hub', request.url));
  }
  
  // Usuário não autenticado - ir para login
  return NextResponse.redirect(new URL('/login', request.url));
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
}; 