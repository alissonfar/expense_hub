'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { apiGet } from '@/lib/api'
import { API_ENDPOINTS } from '@/lib/constants'
import { Transacao, UpdateTransacaoForm } from '@/types'
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  ArrowLeft, 
  Save, 
  Edit3,
  Receipt,
  DollarSign
} from 'lucide-react'
import { useTransacaoMutations } from '@/hooks/useTransacaoMutations'
import { useTags } from '@/hooks/useTags'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'

export default function EditarTransacaoPage() {
  const params = useParams()
  const router = useRouter()
  const id = parseInt(params?.id as string)

  const [transacao, setTransacao] = useState<Transacao | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Estados do formulário
  const [formData, setFormData] = useState<UpdateTransacaoForm>({
    descricao: '',
    local: '',
    observacoes: '',
    tags: []
  })

  const { tags } = useTags()
  const { updateTransacao, updateState } = useTransacaoMutations({
    onSuccess: () => {
      router.push(`/transacoes/${id}`)
    }
  })

  // Buscar dados da transação
  useEffect(() => {
    if (!id || isNaN(id)) {
      setError('ID da transação inválido')
      setLoading(false)
      return
    }

    const fetchTransacao = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await apiGet<{
          success: boolean
          data: Transacao
          message: string
        }>(API_ENDPOINTS.TRANSACOES.GET(id))

        if (response.data.success && response.data.data) {
          const transacaoData = response.data.data
          setTransacao(transacaoData)
          
          // Preencher formulário
          setFormData({
            descricao: transacaoData.descricao || '',
            local: transacaoData.local || '',
            observacoes: transacaoData.observacoes || '',
            tags: transacaoData.transacao_tags?.map(t => t.tag_id) || []
          })
        } else {
          throw new Error(response.data.message || 'Transação não encontrada')
        }
      } catch (err: any) {
        setError(err.message || 'Erro ao carregar transação')
      } finally {
        setLoading(false)
      }
    }

    fetchTransacao()
  }, [id])

  const handleInputChange = (field: keyof UpdateTransacaoForm, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleTagToggle = (tagId: number) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags?.includes(tagId) 
        ? prev.tags.filter(id => id !== tagId)
        : [...(prev.tags || []), tagId]
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!transacao) return

    // Preparar dados para envio (apenas campos alterados)
    const dadosParaEnvio: UpdateTransacaoForm = {}
    
    if (formData.descricao !== transacao.descricao) {
      dadosParaEnvio.descricao = formData.descricao
    }
    if (formData.local !== transacao.local) {
      dadosParaEnvio.local = formData.local
    }
    if (formData.observacoes !== transacao.observacoes) {
      dadosParaEnvio.observacoes = formData.observacoes
    }
    
    // Tags (sempre enviar para comparação no backend)
    const tagsOriginais = transacao.transacao_tags?.map(t => t.tag_id) || []
    const tagsAtuais = formData.tags || []
    
    if (JSON.stringify(tagsOriginais.sort()) !== JSON.stringify(tagsAtuais.sort())) {
      dadosParaEnvio.tags = tagsAtuais
    }

    // Se nenhum campo foi alterado
    if (Object.keys(dadosParaEnvio).length === 0) {
      router.push(`/transacoes/${id}`)
      return
    }

    await updateTransacao(transacao.id, dadosParaEnvio)
  }

  const getTipoIcon = (tipo: string) => {
    return tipo === 'RECEITA' ? Receipt : DollarSign
  }

  const getTipoColor = (tipo: string) => {
    return tipo === 'RECEITA' ? 'text-green-600' : 'text-red-600'
  }

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="space-y-4">
          <div className="h-8 bg-gray-200 rounded animate-pulse" />
          <div className="h-96 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
    )
  }

  if (error || !transacao) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="text-red-600 text-lg font-medium">
                {error || 'Transação não encontrada'}
              </div>
              <Button onClick={() => router.push('/transacoes')} variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar para Transações
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const TipoIcon = getTipoIcon(transacao.tipo)

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/transacoes/${id}`)}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Edit3 className="w-6 h-6" />
              Editar {transacao.tipo === 'RECEITA' ? 'Receita' : 'Gasto'}
            </h1>
            <p className="text-muted-foreground">
              #{transacao.id} - {transacao.descricao}
            </p>
          </div>
        </div>
      </div>

      {/* Informações Não Editáveis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TipoIcon className={`w-5 h-5 ${getTipoColor(transacao.tipo)}`} />
            Informações Fixas
          </CardTitle>
          <CardDescription>
            Estas informações não podem ser alteradas após a criação
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-medium">Tipo:</span>{' '}
              {transacao.tipo === 'RECEITA' ? 'Receita' : 'Gasto'}
            </div>
            <div>
              <span className="font-medium">Valor:</span>{' '}
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
              }).format(transacao.valor_total)}
            </div>
            <div>
              <span className="font-medium">Data:</span>{' '}
              {new Date(transacao.data_transacao).toLocaleDateString('pt-BR')}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Formulário de Edição */}
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Informações Editáveis</CardTitle>
            <CardDescription>
              Edite as informações que podem ser alteradas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Descrição */}
            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição *</Label>
              <Input
                id="descricao"
                value={formData.descricao}
                onChange={(e) => handleInputChange('descricao', e.target.value)}
                placeholder="Digite a descrição da transação"
                required
                maxLength={200}
              />
              <div className="text-xs text-muted-foreground">
                {(formData.descricao || '').length}/200 caracteres
              </div>
            </div>

            {/* Local/Fonte */}
            <div className="space-y-2">
              <Label htmlFor="local">
                {transacao.tipo === 'RECEITA' ? 'Fonte' : 'Local'}
              </Label>
              <Input
                id="local"
                value={formData.local}
                onChange={(e) => handleInputChange('local', e.target.value)}
                placeholder={
                  transacao.tipo === 'RECEITA' 
                    ? "Ex: Salário, Freelance, Venda..."
                    : "Ex: Supermercado, Restaurante, Farmácia..."
                }
                maxLength={150}
              />
              <div className="text-xs text-muted-foreground">
                {(formData.local || '').length}/150 caracteres
              </div>
            </div>

            {/* Observações */}
            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                value={formData.observacoes}
                onChange={(e) => handleInputChange('observacoes', e.target.value)}
                placeholder="Observações adicionais (opcional)"
                rows={3}
                maxLength={1000}
              />
              <div className="text-xs text-muted-foreground">
                {(formData.observacoes || '').length}/1000 caracteres
              </div>
            </div>

            {/* Tags */}
            <div className="space-y-3">
              <Label>Tags (máximo 5)</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {tags.map((tag) => (
                  <div key={tag.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`tag-${tag.id}`}
                      checked={formData.tags?.includes(tag.id) || false}
                      onCheckedChange={() => handleTagToggle(tag.id)}
                      disabled={(formData.tags?.length || 0) >= 5 && !formData.tags?.includes(tag.id)}
                    />
                    <Label 
                      htmlFor={`tag-${tag.id}`}
                      className="flex items-center space-x-2 cursor-pointer"
                    >
                      <Badge 
                        variant="outline"
                        style={{ 
                          borderColor: tag.cor || '#6b7280',
                          color: tag.cor || '#6b7280'
                        }}
                      >
                        {tag.icone && <span className="mr-1">{tag.icone}</span>}
                        {tag.nome}
                      </Badge>
                    </Label>
                  </div>
                ))}
              </div>
              {(formData.tags?.length || 0) > 0 && (
                <div className="text-sm text-muted-foreground">
                  {formData.tags?.length}/5 tags selecionadas
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Botões de Ação */}
        <div className="flex items-center justify-end space-x-4 pt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/transacoes/${id}`)}
            disabled={updateState.loading}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={updateState.loading}
          >
            <Save className="w-4 h-4 mr-2" />
            {updateState.loading ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </div>
      </form>

      {/* Informações sobre Limitações */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="text-sm text-blue-800">
            <strong>💡 Informações importantes:</strong>
            <ul className="mt-2 space-y-1 list-disc list-inside">
              <li>Valor, data e participantes não podem ser alterados após a criação</li>
              <li>Para alterar esses campos, será necessário excluir e recriar a transação</li>
              <li>Transações com pagamentos registrados não podem ser excluídas</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 