'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CreditCard, TrendingUp, Users, DollarSign, CheckCircle2 } from 'lucide-react'
import { TipoTransacao } from '@/types'
import { cn } from '@/lib/utils'

interface TipoTransacaoSelectorProps {
  value: TipoTransacao
  onChange: (tipo: TipoTransacao) => void
  className?: string
}

const cardStyles = {
  base: "cursor-pointer transition-all duration-300 bg-card border-2 border-transparent hover:border-primary/50",
  gasto: {
    selected: "border-destructive shadow-neon-destructive/50",
    icon: "text-destructive",
  },
  receita: {
    selected: "border-success shadow-neon-success/50",
    icon: "text-success",
  }
};

export function TipoTransacaoSelector({ value, onChange, className }: TipoTransacaoSelectorProps) {
  const opcoes = [
    {
      tipo: 'GASTO' as TipoTransacao,
      titulo: 'Novo Gasto',
      descricao: 'Registre uma despesa e divida entre participantes',
      icone: CreditCard,
      featureIcon: Users,
      featureText: 'Divisão entre participantes',
    },
    {
      tipo: 'RECEITA' as TipoTransacao,
      titulo: 'Nova Receita',
      descricao: 'Registre um valor recebido no sistema',
      icone: TrendingUp,
      featureIcon: DollarSign,
      featureText: 'Apenas proprietários',
    }
  ]

  return (
    <div className={cn("grid gap-6 md:grid-cols-2", className)}>
      {opcoes.map((opcao) => {
        const Icone = opcao.icone
        const FeatureIcon = opcao.featureIcon
        const isSelected = value === opcao.tipo
        const styles = opcao.tipo === 'GASTO' ? cardStyles.gasto : cardStyles.receita;
        
        return (
          <Card
            key={opcao.tipo}
            className={cn(
              cardStyles.base,
              isSelected && styles.selected
            )}
            onClick={() => onChange(opcao.tipo)}
          >
            <CardContent className="p-6 relative">
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <Icone className={cn('h-8 w-8 shrink-0 mt-1', isSelected ? styles.icon : 'text-muted-foreground')} />
                  <div className="flex-1">
                    <h3 className={cn('font-bold text-lg', isSelected ? (opcao.tipo === 'GASTO' ? 'text-destructive' : 'text-success') : 'text-foreground')}>
                      {opcao.titulo}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {opcao.descricao}
                    </p>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-white/10">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <FeatureIcon className="h-4 w-4" />
                    <span>{opcao.featureText}</span>
                  </div>
                </div>
              </div>
              
              {isSelected && (
                <CheckCircle2 className={cn("absolute top-4 right-4 h-6 w-6", styles.icon)} />
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
} 