import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// =============================================
// 🔐 MIDDLEWARE DE AUTENTICAÇÃO
// =============================================

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // =============================================
  // 📍 ROTAS PÚBLICAS (NÃO REQUEREM AUTENTICAÇÃO)
  // =============================================
  const publicRoutes = [
    '/',
    '/auth/login',
    '/auth/register', 
    '/auth/forgot-password',
    '/auth/activate-invite',
  ]
  
  // Verificar se é uma rota pública
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next()
  }
  
  // =============================================
  // 🔍 VERIFICAR AUTENTICAÇÃO
  // =============================================
  
  // Verificar se há access token no localStorage (via cookie ou header)
  const accessToken = request.cookies.get('accessToken')?.value || 
                     request.headers.get('authorization')?.replace('Bearer ', '')
  
  // Se não há token e não é rota pública, redirecionar para login
  if (!accessToken) {
    const loginUrl = new URL('/auth/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }
  
  // =============================================
  // 🏢 VERIFICAR CONTEXTO DE HUB
  // =============================================
  
  // Se está tentando acessar uma rota de hub específica
  if (pathname.startsWith('/') && pathname.includes('/dashboard')) {
    const hubId = pathname.split('/')[1] // Extrair hubId da URL
    
    // Verificar se o hubId é válido (não é 'auth' ou outras rotas)
    if (hubId && hubId !== 'auth' && !isNaN(Number(hubId))) {
      // Aqui você poderia verificar se o usuário tem acesso a este hub
      // Por enquanto, apenas permitir o acesso
      return NextResponse.next()
    }
  }
  
  // =============================================
  // ✅ PERMITIR ACESSO
  // =============================================
  return NextResponse.next()
}

// =============================================
// 📋 CONFIGURAÇÃO DO MIDDLEWARE
// =============================================

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
} 