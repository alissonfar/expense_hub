'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, X, Copy, Zap, Calculator, Users, Tag as TagIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'

import { useTransacaoMutations } from '@/hooks/useTransacaoMutations'
import { usePessoas } from '@/hooks/usePessoas'
import { useTags } from '@/hooks/useTags'
import { useAuth } from '@/lib/auth'
import { 
  CreateGastoForm, 
  CreateReceitaForm, 
  ParticipanteForm, 
  TipoTransacao,
  Pessoa,
  Tag
} from '@/types'
import { 
  FORM_DEFAULTS, 
  KEYBOARD_SHORTCUTS, 
  AUTO_SUGGESTIONS,
  TRANSACAO_TEMPLATES
} from '@/lib/constants'

// Schema de validação otimizado
const gastoSchema = z.object({
  descricao: z.string()
    .min(3, 'Descrição deve ter pelo menos 3 caracteres')
    .max(200, 'Descrição muito longa'),
  local: z.string().max(100, 'Local muito longo').optional(),
  valor_total: z.number()
    .min(FORM_DEFAULTS.VALOR_MINIMO, 'Valor deve ser maior que zero')
    .max(FORM_DEFAULTS.VALOR_MAXIMO, 'Valor muito alto'),
  data_transacao: z.string().min(1, 'Data é obrigatória'),
  observacoes: z.string().max(500, 'Observações muito longas').optional(),
  eh_parcelado: z.boolean(),
  total_parcelas: z.number().min(1).max(FORM_DEFAULTS.LIMITE_PARCELAS),
  participantes: z.array(z.object({
    pessoa_id: z.number(),
    nome: z.string(),
    valor_devido: z.number().min(0.01, 'Valor deve ser maior que zero')
  })).min(1, 'Deve haver pelo menos um participante'),
  tags: z.array(z.number()).max(FORM_DEFAULTS.LIMITE_TAGS, 'Muitas tags selecionadas')
})

const receitaSchema = z.object({
  descricao: z.string()
    .min(3, 'Descrição deve ter pelo menos 3 caracteres')
    .max(200, 'Descrição muito longa'),
  local: z.string().max(100, 'Local muito longo').optional(),
  valor_recebido: z.number()
    .min(FORM_DEFAULTS.VALOR_MINIMO, 'Valor deve ser maior que zero')
    .max(FORM_DEFAULTS.VALOR_MAXIMO, 'Valor muito alto'),
  data_transacao: z.string().min(1, 'Data é obrigatória'),
  observacoes: z.string().max(500, 'Observações muito longas').optional(),
  tags: z.array(z.number()).max(FORM_DEFAULTS.LIMITE_TAGS, 'Muitas tags selecionadas')
})

interface TransacaoFormProps {
  tipo: TipoTransacao
  onSuccess?: (continuar?: boolean) => void
  onCancel?: () => void
  defaultValues?: Partial<CreateGastoForm>
  showQuickActions?: boolean
}

export function TransacaoForm({ 
  tipo, 
  onSuccess, 
  onCancel, 
  defaultValues,
  showQuickActions = true 
}: TransacaoFormProps) {
  const { toast } = useToast()
  const { user } = useAuth()
  const { pessoas, getProprietarios } = usePessoas()
  const { tags } = useTags()
  const { createGasto, createReceita, createGastoState, createReceitaState } = useTransacaoMutations()

  // Estados para UX otimizada
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [autoCalculate, setAutoCalculate] = useState(true)
  const [ultimaTransacao, setUltimaTransacao] = useState<CreateGastoForm | null>(null)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)

  // Refs para atalhos de teclado
  const descricaoRef = useRef<HTMLInputElement>(null)
  const valorRef = useRef<HTMLInputElement>(null)
  const dataRef = useRef<HTMLInputElement>(null)

  // Schema dinâmico baseado no tipo
  const schema = tipo === 'GASTO' ? gastoSchema : receitaSchema

  // Form setup
  const form = useForm<CreateGastoForm | CreateReceitaForm>({
    resolver: zodResolver(schema),
    defaultValues: {
      descricao: defaultValues?.descricao || '',
      local: defaultValues?.local || '',
      valor_total: defaultValues?.valor_total || 0,
      valor_recebido: defaultValues?.valor_total || 0,
      data_transacao: defaultValues?.data_transacao || FORM_DEFAULTS.DATA_PADRAO(),
      observacoes: defaultValues?.observacoes || '',
      eh_parcelado: defaultValues?.eh_parcelado || false,
      total_parcelas: defaultValues?.total_parcelas || FORM_DEFAULTS.PARCELAS_PADRAO,
      participantes: defaultValues?.participantes || [],
      tags: defaultValues?.tags || []
    }
  })

  // Field array para participantes (apenas para gastos)
  const { fields: participantesFields, append: addParticipante, remove: removeParticipante } = useFieldArray({
    control: form.control,
    name: 'participantes' as any
  })

  // Valores observados para cálculos automáticos
  const watchedValues = form.watch()
  const valorTotal = form.watch('valor_total' as any) || form.watch('valor_recebido' as any) || 0
  const participantes = form.watch('participantes' as any) || []

  // Auto-cálculo de participantes
  useEffect(() => {
    if (tipo === 'GASTO' && autoCalculate && participantes.length > 0 && valorTotal > 0) {
      const valorPorParticipante = valorTotal / participantes.length
      
      participantes.forEach((_, index) => {
        form.setValue(`participantes.${index}.valor_devido` as any, Number(valorPorParticipante.toFixed(2)))
      })
    }
  }, [valorTotal, participantes.length, autoCalculate, tipo, form])

  // Adicionar proprietário automaticamente se não existir
  useEffect(() => {
    if (tipo === 'GASTO' && user && participantes.length === 0) {
      addParticipante({
        pessoa_id: user.id,
        nome: user.nome,
        valor_devido: valorTotal || 0
      })
    }
  }, [tipo, user, participantes.length, valorTotal, addParticipante])

  // Sugestões automáticas
  const handleDescricaoChange = useCallback((value: string) => {
    if (value.length >= 2) {
      const filtered = AUTO_SUGGESTIONS.DESCRICOES_COMUNS.filter(desc =>
        desc.toLowerCase().includes(value.toLowerCase())
      )
      setSuggestions(filtered.slice(0, 5))
      setShowSuggestions(filtered.length > 0)
    } else {
      setShowSuggestions(false)
    }
  }, [])

  // Aplicar template
  const aplicarTemplate = useCallback((template: typeof TRANSACAO_TEMPLATES[0]) => {
    form.setValue('descricao', template.descricao)
    if (template.nome.includes('Supermercado')) {
      form.setValue('local', 'Supermercado Extra')
    }
    descricaoRef.current?.focus()
  }, [form])

  // Duplicar última transação
  const duplicarUltima = useCallback(() => {
    if (ultimaTransacao) {
      Object.entries(ultimaTransacao).forEach(([key, value]) => {
        if (key !== 'data_transacao') { // Manter data atual
          form.setValue(key as any, value)
        }
      })
      toast({
        title: "Transação duplicada!",
        description: "Dados da última transação foram aplicados",
      })
    }
  }, [ultimaTransacao, form, toast])

  // Dividir valor igualmente
  const dividirIgualmente = useCallback(() => {
    if (participantes.length > 0 && valorTotal > 0) {
      const valorPorParticipante = Number((valorTotal / participantes.length).toFixed(2))
      
      participantes.forEach((_, index) => {
        form.setValue(`participantes.${index}.valor_devido` as any, valorPorParticipante)
      })

      toast({
        title: "Valor dividido igualmente!",
        description: `${new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        }).format(valorPorParticipante)} por participante`,
      })
    }
  }, [participantes, valorTotal, form, toast])

  // Adicionar participante rápido
  const adicionarParticipanteRapido = useCallback((pessoa: Pessoa) => {
    const jaExiste = participantes.some((p: ParticipanteForm) => p.pessoa_id === pessoa.id)
    if (!jaExiste) {
      addParticipante({
        pessoa_id: pessoa.id,
        nome: pessoa.nome,
        valor_devido: autoCalculate ? Number((valorTotal / (participantes.length + 1)).toFixed(2)) : 0
      })
    }
  }, [participantes, addParticipante, valorTotal, autoCalculate])

  // Atalhos de teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+1 - Focar descrição
      if (e.ctrlKey && e.key === '1') {
        e.preventDefault()
        descricaoRef.current?.focus()
      }
      // Ctrl+2 - Focar valor
      else if (e.ctrlKey && e.key === '2') {
        e.preventDefault()
        valorRef.current?.focus()
      }
      // Ctrl+3 - Focar data
      else if (e.ctrlKey && e.key === '3') {
        e.preventDefault()
        dataRef.current?.focus()
      }
      // Ctrl+D - Duplicar última
      else if (e.ctrlKey && e.key === 'd' && ultimaTransacao) {
        e.preventDefault()
        duplicarUltima()
      }
      // Ctrl+Enter - Salvar e criar novo
      else if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault()
        form.handleSubmit(data => handleSubmit(data, true))()
      }
      // Escape - Cancelar
      else if (e.key === 'Escape') {
        e.preventDefault()
        onCancel?.()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [ultimaTransacao, duplicarUltima, form, onCancel])

  // Submit handler
  const handleSubmit = async (data: CreateGastoForm | CreateReceitaForm, continuar = false) => {
    try {
      let resultado = null

      if (tipo === 'GASTO') {
        resultado = await createGasto(data as CreateGastoForm)
      } else {
        resultado = await createReceita(data as CreateReceitaForm)
      }

      if (resultado) {
        // Salvar para duplicação futura
        if (tipo === 'GASTO') {
          setUltimaTransacao(data as CreateGastoForm)
        }

        if (continuar) {
          // Limpar formulário mas manter alguns dados
          form.reset({
            descricao: '',
            local: data.local, // Manter local
            valor_total: 0,
            valor_recebido: 0,
            data_transacao: FORM_DEFAULTS.DATA_PADRAO(),
            observacoes: '',
            eh_parcelado: false,
            total_parcelas: FORM_DEFAULTS.PARCELAS_PADRAO,
            participantes: tipo === 'GASTO' ? (data as CreateGastoForm).participantes : [], // Manter participantes
            tags: data.tags // Manter tags
          })
          
          // Focar no campo descrição
          setTimeout(() => descricaoRef.current?.focus(), 100)
        }

        onSuccess?.(continuar)
      }
    } catch (error) {
      console.error('Erro ao salvar transação:', error)
    }
  }

  const isLoading = createGastoState.loading || createReceitaState.loading

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      {showQuickActions && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Ações Rápidas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Templates */}
            <div className="flex flex-wrap gap-2">
              {TRANSACAO_TEMPLATES.map((template) => (
                <Button
                  key={template.id}
                  variant="outline"
                  size="sm"
                  onClick={() => aplicarTemplate(template)}
                  className="text-xs"
                >
                  {template.icone} {template.nome}
                </Button>
              ))}
            </div>

            {/* Ações */}
            <div className="flex flex-wrap gap-2">
              {ultimaTransacao && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={duplicarUltima}
                  className="text-xs"
                >
                  <Copy className="h-3 w-3 mr-1" />
                  Duplicar Última (Ctrl+D)
                </Button>
              )}
              
              {tipo === 'GASTO' && participantes.length > 1 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={dividirIgualmente}
                  className="text-xs"
                >
                  <Calculator className="h-3 w-3 mr-1" />
                  Dividir Igualmente
                </Button>
              )}
            </div>

            {/* Atalhos */}
            <div className="text-xs text-muted-foreground">
              <strong>Atalhos:</strong> Ctrl+1 (Descrição) | Ctrl+2 (Valor) | Ctrl+3 (Data) | Ctrl+Enter (Salvar e Novo) | Esc (Cancelar)
            </div>
          </CardContent>
        </Card>
      )}

      {/* Formulário Principal */}
      <form onSubmit={form.handleSubmit(data => handleSubmit(data, false))} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {tipo === 'GASTO' ? '💸' : '💰'} 
              {tipo === 'GASTO' ? 'Novo Gasto' : 'Nova Receita'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Descrição com sugestões */}
            <div className="space-y-2 relative">
              <Label htmlFor="descricao">Descrição *</Label>
              <Input
                id="descricao"
                ref={descricaoRef}
                {...form.register('descricao')}
                onChange={(e) => {
                  form.setValue('descricao', e.target.value)
                  handleDescricaoChange(e.target.value)
                }}
                placeholder="Ex: Supermercado - compras da semana"
                className="pr-10"
              />
              
              {/* Sugestões */}
              {showSuggestions && (
                <div className="absolute top-full left-0 right-0 z-10 bg-white border rounded-md shadow-lg max-h-40 overflow-y-auto">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      type="button"
                      className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm"
                      onClick={() => {
                        form.setValue('descricao', suggestion)
                        setShowSuggestions(false)
                      }}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
              
              {form.formState.errors.descricao && (
                <p className="text-sm text-red-500">{form.formState.errors.descricao.message}</p>
              )}
            </div>

            {/* Local */}
            <div className="space-y-2">
              <Label htmlFor="local">Local</Label>
              <Input
                id="local"
                {...form.register('local')}
                placeholder="Ex: Supermercado Extra, Restaurante..."
                list="locais-sugestoes"
              />
              <datalist id="locais-sugestoes">
                {AUTO_SUGGESTIONS.LOCAIS_COMUNS.map((local, index) => (
                  <option key={index} value={local} />
                ))}
              </datalist>
            </div>

            {/* Valor e Data */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="valor">
                  {tipo === 'GASTO' ? 'Valor Total *' : 'Valor Recebido *'}
                </Label>
                <Input
                  id="valor"
                  ref={valorRef}
                  type="number"
                  step="0.01"
                  min={FORM_DEFAULTS.VALOR_MINIMO}
                  max={FORM_DEFAULTS.VALOR_MAXIMO}
                  {...form.register(tipo === 'GASTO' ? 'valor_total' : 'valor_recebido' as any, {
                    valueAsNumber: true
                  })}
                  placeholder="0,00"
                />
                {form.formState.errors.valor_total && (
                  <p className="text-sm text-red-500">{form.formState.errors.valor_total.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="data">Data *</Label>
                <Input
                  id="data"
                  ref={dataRef}
                  type="date"
                  {...form.register('data_transacao')}
                />
                {form.formState.errors.data_transacao && (
                  <p className="text-sm text-red-500">{form.formState.errors.data_transacao.message}</p>
                )}
              </div>
            </div>

            {/* Participantes (apenas para gastos) */}
            {tipo === 'GASTO' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Participantes *
                  </Label>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="auto-calculate"
                      checked={autoCalculate}
                      onCheckedChange={setAutoCalculate}
                    />
                    <Label htmlFor="auto-calculate" className="text-sm">
                      Dividir automaticamente
                    </Label>
                  </div>
                </div>

                {/* Lista de participantes */}
                <div className="space-y-2">
                  {participantesFields.map((field, index) => {
                    const participante = participantes[index]
                    return (
                      <div key={field.id} className="flex items-center gap-2 p-3 border rounded-lg">
                        <div className="flex-1">
                          <Select
                            value={participante?.pessoa_id?.toString() || ''}
                            onValueChange={(value) => {
                              const pessoa = pessoas.find(p => p.id === Number(value))
                              if (pessoa) {
                                form.setValue(`participantes.${index}.pessoa_id` as any, pessoa.id)
                                form.setValue(`participantes.${index}.nome` as any, pessoa.nome)
                              }
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecionar pessoa" />
                            </SelectTrigger>
                            <SelectContent>
                              {pessoas.map((pessoa) => (
                                <SelectItem key={pessoa.id} value={pessoa.id.toString()}>
                                  {pessoa.nome} {pessoa.eh_proprietario && '(Proprietário)'}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="w-32">
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0,00"
                            {...form.register(`participantes.${index}.valor_devido` as any, {
                              valueAsNumber: true
                            })}
                          />
                        </div>

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeParticipante(index)}
                          disabled={participantesFields.length === 1}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )
                  })}
                </div>

                {/* Adicionar participante */}
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addParticipante({
                      pessoa_id: 0,
                      nome: '',
                      valor_devido: 0
                    })}
                    disabled={participantesFields.length >= FORM_DEFAULTS.LIMITE_PARTICIPANTES}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Adicionar
                  </Button>

                  {/* Botões rápidos para proprietários */}
                  {getProprietarios().filter(p => !participantes.some((part: ParticipanteForm) => part.pessoa_id === p.id)).map((pessoa) => (
                    <Button
                      key={pessoa.id}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => adicionarParticipanteRapido(pessoa)}
                    >
                      + {pessoa.nome}
                    </Button>
                  ))}
                </div>

                {/* Validação de soma */}
                {participantes.length > 0 && valorTotal > 0 && (
                  <div className="text-sm">
                    <div className="flex justify-between">
                      <span>Valor total:</span>
                      <span className="font-medium">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL'
                        }).format(valorTotal)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Soma participantes:</span>
                      <span className={`font-medium ${
                        Math.abs(valorTotal - participantes.reduce((acc: number, p: ParticipanteForm) => acc + (p.valor_devido || 0), 0)) > 0.01
                          ? 'text-red-500' : 'text-green-500'
                      }`}>
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL'
                        }).format(participantes.reduce((acc: number, p: ParticipanteForm) => acc + (p.valor_devido || 0), 0))}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tags */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <TagIcon className="h-4 w-4" />
                Tags
              </Label>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => {
                  const isSelected = form.watch('tags')?.includes(tag.id)
                  return (
                    <Badge
                      key={tag.id}
                      variant={isSelected ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => {
                        const currentTags = form.watch('tags') || []
                        if (isSelected) {
                          form.setValue('tags', currentTags.filter(id => id !== tag.id))
                        } else {
                          if (currentTags.length < FORM_DEFAULTS.LIMITE_TAGS) {
                            form.setValue('tags', [...currentTags, tag.id])
                          }
                        }
                      }}
                      style={{ backgroundColor: isSelected ? tag.cor : undefined }}
                    >
                      {tag.icone} {tag.nome}
                    </Badge>
                  )
                })}
              </div>
            </div>

            {/* Parcelamento (apenas para gastos) */}
            {tipo === 'GASTO' && (
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="eh_parcelado"
                    {...form.register('eh_parcelado')}
                  />
                  <Label htmlFor="eh_parcelado">Parcelado</Label>
                </div>

                {form.watch('eh_parcelado') && (
                  <div className="ml-6">
                    <Label htmlFor="total_parcelas">Número de parcelas</Label>
                    <Input
                      id="total_parcelas"
                      type="number"
                      min="2"
                      max={FORM_DEFAULTS.LIMITE_PARCELAS}
                      {...form.register('total_parcelas', { valueAsNumber: true })}
                      className="w-32"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Observações */}
            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                {...form.register('observacoes')}
                placeholder="Informações adicionais..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Botões de ação */}
        <div className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
          >
            Cancelar
          </Button>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={form.handleSubmit(data => handleSubmit(data, true))}
              disabled={isLoading}
            >
              {isLoading ? 'Salvando...' : 'Salvar e Criar Novo'}
            </Button>
            
            <Button
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
} 