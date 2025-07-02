import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// =============================================
// 🔐 MIDDLEWARE DE AUTENTICAÇÃO APRIMORADO
// =============================================

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl
  
  console.log(`[Middleware] ${request.method} ${pathname}`)

  // =============================================
  // 📍 ROTAS PÚBLICAS (NÃO REQUEREM AUTENTICAÇÃO)
  // =============================================
  const publicRoutes = [
    '/',
    '/auth/login',
    '/auth/register', 
    '/auth/forgot-password',
    '/auth/activate-invite',
    '/auth/select-hub',
    '/unauthorized'
  ]
  
  // Verificar se é uma rota pública
  if (publicRoutes.includes(pathname)) {
    console.log(`[Middleware] Rota pública permitida: ${pathname}`)
    return NextResponse.next()
  }

  // Permitir assets estáticos
  if (pathname.startsWith('/_next/') || 
      pathname.startsWith('/favicon') || 
      pathname.includes('.')) {
    return NextResponse.next()
  }
  
  // =============================================
  // 🔍 VERIFICAR TOKENS DE AUTENTICAÇÃO
  // =============================================
  
  const accessToken = request.cookies.get('accessToken')?.value || 
                     request.headers.get('authorization')?.replace('Bearer ', '')

  console.log(`[Middleware] Access token: ${accessToken ? 'presente' : 'ausente'}`)
  
  // Se não há token, redirecionar para login
  if (!accessToken) {
    console.log(`[Middleware] Token ausente - redirecionando para login`)
    const loginUrl = new URL('/auth/login', request.url)
    if (pathname !== '/auth/login') {
      loginUrl.searchParams.set('redirect', pathname)
    }
    return NextResponse.redirect(loginUrl)
  }

  // =============================================
  // 🏢 VERIFICAR CONTEXTO DE HUB
  // =============================================
  
  // Verificar se está tentando acessar uma rota específica de hub
  const hubRouteMatch = pathname.match(/^\/(\d+)\/(.+)$/)
  
  if (hubRouteMatch) {
    const [, hubIdStr, route] = hubRouteMatch
    const hubId = parseInt(hubIdStr)
    
    if (isNaN(hubId)) {
      console.log(`[Middleware] Hub ID inválido: ${hubIdStr}`)
      return NextResponse.redirect(new URL('/auth/select-hub', request.url))
    }

    console.log(`[Middleware] Acesso ao hub ${hubId}, rota: ${route}`)

    // Validação básica de token (verificar se não está expirado)
    if (!isTokenValid(accessToken)) {
      console.log(`[Middleware] Token inválido ou expirado`)
      
      // Tentar redirecionar para select-hub para refresh automático
      const selectHubUrl = new URL('/auth/select-hub', request.url)
      selectHubUrl.searchParams.set('hubId', hubId.toString())
      selectHubUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(selectHubUrl)
    }

    // Adicionar headers com informações do hub para o frontend
    const response = NextResponse.next()
    response.headers.set('X-Hub-Id', hubId.toString())
    response.headers.set('X-Hub-Route', route)
    
    console.log(`[Middleware] Acesso autorizado ao hub ${hubId}`)
    return response
  }

  // =============================================
  // 🚫 ROTAS SEM HUB ESPECÍFICO MAS PROTEGIDAS
  // =============================================
  
  // Se chegou até aqui e não é uma rota de hub específica,
  // mas requer autenticação, verificar se precisa selecionar hub
  if (pathname.startsWith('/profile') || 
      pathname.startsWith('/settings') ||
      pathname.startsWith('/dashboard')) {
    
    console.log(`[Middleware] Rota protegida sem hub específico: ${pathname}`)
    
    // Redirecionar para seleção de hub
    return NextResponse.redirect(new URL('/auth/select-hub', request.url))
  }

  // =============================================
  // ✅ PERMITIR ACESSO PADRÃO
  // =============================================
  
  console.log(`[Middleware] Acesso padrão permitido: ${pathname}`)
  return NextResponse.next()
}

// =============================================
// 🔧 UTILITÁRIOS
// =============================================

/**
 * Verificação básica se o token JWT não está expirado
 */
function isTokenValid(token: string): boolean {
  try {
    // Decodificar payload sem verificar assinatura (apenas para checar expiração)
    const parts = token.split('.')
    if (parts.length !== 3) return false
    
    const payload = JSON.parse(atob(parts[1]))
    
    // Verificar se tem timestamp de expiração
    if (!payload.exp) return true // Se não tem exp, assumir válido
    
    // Verificar se não expirou (com margem de 5 minutos)
    const now = Math.floor(Date.now() / 1000)
    const margin = 5 * 60 // 5 minutos
    
    const isValid = payload.exp > (now + margin)
    console.log(`[Middleware] Token expira em: ${payload.exp}, agora: ${now}, válido: ${isValid}`)
    
    return isValid
  } catch (error) {
    console.log(`[Middleware] Erro ao verificar token:`, error)
    return false
  }
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