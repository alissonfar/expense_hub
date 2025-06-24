'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Edit, Crown, User, Mail, Phone, Calendar, Activity } from 'lucide-react'
import { notFound } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'

import { usePessoas } from '@/hooks/usePessoas'
import { useAuth } from '@/lib/auth'

interface PessoaDetalhesPageProps {
  params: {
    id: string
  }
}

export default function PessoaDetalhesPage({ params }: PessoaDetalhesPageProps) {
  const router = useRouter()
  const { user } = useAuth()
  const { pessoas, loading, error } = usePessoas()

  const pessoaId = parseInt(params.id)
  const pessoa = pessoas.find(p => p.id === pessoaId)

  // Função para gerar iniciais do nome
  const getInitials = (nome: string) => {
    return nome
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  // Função para gerar cor do avatar
  const getAvatarColor = (nome: string) => {
    const colors = [
      'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500',
      'bg-pink-500', 'bg-indigo-500', 'bg-red-500', 'bg-orange-500'
    ]
    const index = nome.length % colors.length
    return colors[index]
  }

  // Verificar se usuário pode gerenciar pessoas
  const canManage = user?.eh_proprietario

  if (loading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-20" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-4">
              <Skeleton className="h-16 w-16 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-red-500 mb-4">Erro ao carregar pessoa: {error}</p>
              <Button onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!pessoa) {
    notFound()
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Detalhes da Pessoa</h1>
            <p className="text-muted-foreground">
              Informações completas sobre {pessoa.nome}
            </p>
          </div>
        </div>

        {canManage && (
          <Button onClick={() => router.push(`/pessoas/${pessoa.id}/editar`)}>
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Button>
        )}
      </div>

      {/* Informações Principais */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Informações Pessoais
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-6">
            {/* Avatar */}
            <Avatar className="h-20 w-20">
              <AvatarFallback className={`text-white text-xl ${getAvatarColor(pessoa.nome)}`}>
                {getInitials(pessoa.nome)}
              </AvatarFallback>
            </Avatar>

            {/* Informações */}
            <div className="flex-1 space-y-4">
              {/* Nome e Status */}
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-2xl font-semibold">{pessoa.nome}</h2>
                  {pessoa.eh_proprietario ? (
                    <Badge variant="default" className="bg-yellow-100 text-yellow-800 border-yellow-300">
                      <Crown className="h-3 w-3 mr-1" />
                      Proprietário
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      <User className="h-3 w-3 mr-1" />
                      Participante
                    </Badge>
                  )}
                </div>
              </div>

              {/* Contatos */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{pessoa.email}</p>
                  </div>
                </div>

                {pessoa.telefone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Telefone</p>
                      <p className="font-medium">{pessoa.telefone}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Datas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Criado em</p>
                    <p className="font-medium">
                      {new Date(pessoa.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Activity className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Última atualização</p>
                    <p className="font-medium">
                      {new Date(pessoa.updated_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas (se disponível) */}
      {pessoa.estatisticas && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Estatísticas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">
                  {pessoa.estatisticas.total_transacoes}
                </p>
                <p className="text-sm text-muted-foreground">Transações</p>
              </div>

              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  R$ {pessoa.estatisticas.total_pago?.toFixed(2) || '0,00'}
                </p>
                <p className="text-sm text-muted-foreground">Total Pago</p>
              </div>

              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">
                  R$ {pessoa.estatisticas.total_pendente?.toFixed(2) || '0,00'}
                </p>
                <p className="text-sm text-muted-foreground">Pendente</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Permissões (para proprietários) */}
      {pessoa.eh_proprietario && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5" />
              Permissões de Proprietário
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                <span className="text-sm">Gerenciar pessoas</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                <span className="text-sm">Criar transações</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                <span className="text-sm">Gerenciar pagamentos</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                <span className="text-sm">Acessar relatórios</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                <span className="text-sm">Configurar sistema</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                <span className="text-sm">Gerenciar tags</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 