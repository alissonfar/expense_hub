'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CreditCard, TrendingUp, Users, DollarSign } from 'lucide-react'
import { TipoTransacao } from '@/types'
import { cn } from '@/lib/utils'

interface TipoTransacaoSelectorProps {
  value: TipoTransacao
  onChange: (tipo: TipoTransacao) => void
  className?: string
}

export function TipoTransacaoSelector({ 
  value, 
  onChange, 
  className 
}: TipoTransacaoSelectorProps) {
  const opcoes = [
    {
      tipo: 'GASTO' as TipoTransacao,
      titulo: 'Novo Gasto',
      descricao: 'Registre uma despesa e divida entre participantes',
      exemplos: ['Supermercado', 'Restaurante', 'Combustível', 'Cinema'],
      icone: CreditCard,
      cor: 'border-red-200 bg-red-50 hover:bg-red-100',
      corAtiva: 'border-red-500 bg-red-100 ring-2 ring-red-200',
      corIcone: 'text-red-600',
      badge: 'Divisível'
    },
    {
      tipo: 'RECEITA' as TipoTransacao,
      titulo: 'Nova Receita',
      descricao: 'Registre um valor recebido no sistema',
      exemplos: ['Salário', 'Freelance', 'Venda', 'Reembolso'],
      icone: TrendingUp,
      cor: 'border-green-200 bg-green-50 hover:bg-green-100',
      corAtiva: 'border-green-500 bg-green-100 ring-2 ring-green-200',
      corIcone: 'text-green-600',
      badge: 'Proprietário'
    }
  ]

  return (
    <div className={cn("grid gap-4 md:grid-cols-2", className)}>
      {opcoes.map((opcao) => {
        const Icone = opcao.icone
        const isSelected = value === opcao.tipo
        
        return (
          <Card
            key={opcao.tipo}
            className={cn(
              'cursor-pointer transition-all duration-200 hover:shadow-md',
              isSelected ? opcao.corAtiva : opcao.cor
            )}
            onClick={() => onChange(opcao.tipo)}
          >
            <CardContent className="p-6">
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'p-2 rounded-lg',
                      isSelected ? 'bg-white/70' : 'bg-white/50'
                    )}>
                      <Icone className={cn('h-5 w-5', opcao.corIcone)} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{opcao.titulo}</h3>
                      <Badge 
                        variant="secondary" 
                        className={cn(
                          'text-xs',
                          opcao.tipo === 'GASTO' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                        )}
                      >
                        {opcao.badge}
                      </Badge>
                    </div>
                  </div>
                  
                  {isSelected && (
                    <div className={cn(
                      'w-6 h-6 rounded-full flex items-center justify-center',
                      opcao.tipo === 'GASTO' ? 'bg-red-500' : 'bg-green-500'
                    )}>
                      <div className="w-2 h-2 bg-white rounded-full" />
                    </div>
                  )}
                </div>

                {/* Descrição */}
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {opcao.descricao}
                </p>

                {/* Exemplos */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-medium">Exemplos:</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {opcao.exemplos.map((exemplo, index) => (
                      <Badge 
                        key={index}
                        variant="outline" 
                        className="text-xs bg-white/60 border-current/20"
                      >
                        {exemplo}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Features específicas */}
                <div className="pt-2 border-t border-current/10">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {opcao.tipo === 'GASTO' ? (
                      <>
                        <Users className="h-3 w-3" />
                        <span>Divisão entre participantes</span>
                      </>
                    ) : (
                      <>
                        <DollarSign className="h-3 w-3" />
                        <span>Apenas proprietários</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
} 