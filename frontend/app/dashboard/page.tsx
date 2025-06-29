'use client'

import { useAuth } from '@/hooks/use-auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'

function DashboardContent() {
  const { user, currentHub, logout } = useAuth()

  if (!user || !currentHub) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p>Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Hub: {currentHub.nome} • {user.nome} ({currentHub.role})
              </p>
            </div>
            <Button onClick={() => logout()} variant="outline">
              Logout
            </Button>
          </div>
        </div>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Gastos do Mês</CardDescription>
              <CardTitle className="text-2xl">
                {formatCurrency(1250.80)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                +12% desde o mês passado
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Pendências</CardDescription>
              <CardTitle className="text-2xl text-red-600">
                {formatCurrency(320.50)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                3 transações pendentes
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Receitas</CardDescription>
              <CardTitle className="text-2xl text-green-600">
                {formatCurrency(2500.00)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                Salário + extras
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Saldo</CardDescription>
              <CardTitle className="text-2xl text-blue-600">
                {formatCurrency(1249.20)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                Saldo atual
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Seções de Conteúdo */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Transações Recentes */}
          <Card>
            <CardHeader>
              <CardTitle>Transações Recentes</CardTitle>
              <CardDescription>
                Suas últimas movimentações financeiras
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div>
                    <p className="font-medium">Supermercado</p>
                    <p className="text-sm text-gray-500">Hoje às 14:30</p>
                  </div>
                  <p className="font-medium text-red-600">-{formatCurrency(85.50)}</p>
                </div>

                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div>
                    <p className="font-medium">Combustível</p>
                    <p className="text-sm text-gray-500">Ontem às 18:45</p>
                  </div>
                  <p className="font-medium text-red-600">-{formatCurrency(120.00)}</p>
                </div>

                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div>
                    <p className="font-medium">Salário</p>
                    <p className="text-sm text-gray-500">5 dias atrás</p>
                  </div>
                  <p className="font-medium text-green-600">+{formatCurrency(2500.00)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pendências */}
          <Card>
            <CardHeader>
              <CardTitle>Pendências</CardTitle>
              <CardDescription>
                Transações que precisam de atenção
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <div>
                    <p className="font-medium">Jantar Restaurante</p>
                    <p className="text-sm text-gray-500">Aguardando confirmação</p>
                  </div>
                  <p className="font-medium text-yellow-600">{formatCurrency(145.80)}</p>
                </div>

                <div className="flex justify-between items-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                  <div>
                    <p className="font-medium">Cinema</p>
                    <p className="text-sm text-gray-500">Pagamento pendente</p>
                  </div>
                  <p className="font-medium text-red-600">{formatCurrency(60.00)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  )
} 