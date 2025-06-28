'use client'

import React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Users, CreditCard, Plus, Search } from 'lucide-react'

export default function NovoPagamentoPage() {
  const router = useRouter()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/pagamentos">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Novo Pagamento</h1>
            <p className="text-muted-foreground">
              Escolha como deseja registrar o pagamento
            </p>
          </div>
        </div>
      </div>

      {/* Opções de Pagamento */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Opção 1: Pagar por Pessoa */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <Button
            variant="ghost"
            className="w-full h-full p-0"
            onClick={() => router.push('/pagamentos/novo/por-pessoa')}
          >
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <Users className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Pagar por Pessoa</h3>
                  <p className="text-muted-foreground">
                    Selecione uma pessoa e veja todas as suas transações pendentes para pagar
                  </p>
                </div>
                <div className="text-sm text-blue-600 font-medium">
                  Ver transações pendentes →
                </div>
              </div>
            </CardContent>
          </Button>
        </Card>

        {/* Opção 2: Pagar por Transação */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <Button
            variant="ghost"
            className="w-full h-full p-0"
            onClick={() => router.push('/pagamentos/novo/por-transacao')}
          >
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <CreditCard className="w-8 h-8 text-green-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Pagar por Transação</h3>
                  <p className="text-muted-foreground">
                    Selecione transações específicas para pagar individualmente ou em conjunto
                  </p>
                </div>
                <div className="text-sm text-green-600 font-medium">
                  Selecionar transações →
                </div>
              </div>
            </CardContent>
          </Button>
        </Card>
      </div>

      {/* Informações Adicionais */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Qual opção escolher?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <h4 className="font-medium text-blue-600">Pagar por Pessoa</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Veja todas as transações pendentes de uma pessoa</li>
                <li>• Ideal quando alguém quer pagar várias dívidas de uma vez</li>
                <li>• Visualize o saldo total pendente</li>
                <li>• Selecione quais transações pagar</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-green-600">Pagar por Transação</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Selecione transações específicas de qualquer pessoa</li>
                <li>• Ideal para pagamentos pontuais</li>
                <li>• Pagamento individual ou composto</li>
                <li>• Mais flexibilidade na seleção</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 