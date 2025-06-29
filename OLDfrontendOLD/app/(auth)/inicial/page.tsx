'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  DollarSign, 
  Users, 
  FileText, 
  BarChart3,
  Plus,
  ArrowRight,
  Wallet,
  Tags
} from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth'

export default function InicialPage() {
  const { user } = useAuth()

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">
          Bem-vindo ao Hub de Gastos! 👋
        </h1>
        <p className="text-xl text-muted-foreground">
          Olá, <span className="font-semibold text-foreground">{user?.nome}</span>!
        </p>
        <p className="text-muted-foreground">
          Gerencie seus gastos pessoais de forma simples e eficiente
        </p>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BarChart3 className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-blue-900">Dashboard</p>
                <p className="text-xs text-blue-700">Visão geral completa</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-green-900">Transações</p>
                <p className="text-xs text-green-700">Gastos e receitas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-purple-50/50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-purple-900">Pessoas</p>
                <p className="text-xs text-purple-700">Contatos e dívidas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50/50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <FileText className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-orange-900">Relatórios</p>
                <p className="text-xs text-orange-700">Análises detalhadas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Navigation */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Ações Rápidas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Ações Rápidas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full justify-start" asChild>
              <Link href="/transacoes/nova">
                <DollarSign className="w-4 h-4 mr-2" />
                Registrar Novo Gasto
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/pagamentos/novo">
                <Wallet className="w-4 h-4 mr-2" />
                Registrar Pagamento
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/pessoas">
                <Users className="w-4 h-4 mr-2" />
                Gerenciar Pessoas
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Navegação Principal */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowRight className="w-5 h-5" />
              Explorar Sistema
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/dashboard">
                <BarChart3 className="w-4 h-4 mr-2" />
                Ver Dashboard Completo
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/transacoes">
                <DollarSign className="w-4 h-4 mr-2" />
                Todas as Transações
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/relatorios">
                <FileText className="w-4 h-4 mr-2" />
                Relatórios e Análises
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/tags">
                <Tags className="w-4 h-4 mr-2" />
                Gerenciar Tags
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* User Info */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-lg">Sua Conta</h3>
              <p className="text-sm text-muted-foreground">
                Tipo: {user?.eh_proprietario ? 'Proprietário' : 'Participante'}
              </p>
              <p className="text-sm text-muted-foreground">
                Email: {user?.email}
              </p>
            </div>
            <Button variant="outline" asChild>
              <Link href="/configuracoes">
                Configurações
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Footer Info */}
      <div className="text-center text-sm text-muted-foreground pt-6 border-t">
        <p>
          Sistema funcionando perfeitamente! 🚀 
          <br />
          Navegue pelas opções acima para começar a usar.
        </p>
      </div>
    </div>
  )
} 