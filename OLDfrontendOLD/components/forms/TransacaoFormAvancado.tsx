'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { 
  Save, 
  X, 
  Plus, 
  Trash2, 
  Calculator, 
  Users, 
  Tag, 
  CreditCard,
  DollarSign,
  Calendar,
  MapPin,
  FileText,
  AlertCircle,
  Check,
  TrendingUp,
  Keyboard,
  Settings,
  RotateCcw,
  ArrowLeft
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/lib/auth'
import { useTransacaoMutations } from '@/hooks/useTransacaoMutations'
import { usePessoas } from '@/hooks/usePessoas'
import { useTags } from '@/hooks/useTags'
import { TipoTransacao, ParticipanteForm, CreateGastoForm, CreateReceitaForm } from '@/types'
import { formatCurrency, generateAvatarColor, getInitials } from '@/lib/utils'

interface TransacaoFormAvancadoProps {
  tipo: TipoTransacao
  onSuccess?: () => void
  onCancel?: () => void
  initialData?: Partial<CreateGastoForm | CreateReceitaForm>
}

export function TransacaoFormAvancado({ 
  tipo, 
  onSuccess, 
  onCancel,
  initialData 
}: TransacaoFormAvancadoProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const { pessoas, loading: loadingPessoas } = usePessoas()
  const { tags, loading: loadingTags } = useTags()
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [activeTab, setActiveTab] = useState('basico')
  
  // ✅ CORREÇÃO: Novos estados para feedback visual detalhado
  const [processStage, setProcessStage] = useState<'idle' | 'validating' | 'preparing' | 'sending' | 'processing' | 'success' | 'error'>('idle')
  const [processMessage, setProcessMessage] = useState('')
  const [countdownTime, setCountdownTime] = useState(6)
  
  // ✅ CORREÇÃO: Novo estado para controlar comportamento pós-salvamento
  const [postSaveAction, setPostSaveAction] = useState<'stay' | 'redirect'>('stay')
  
  // ✅ CORREÇÃO: Efeito para countdown visual no sucesso
  useEffect(() => {
    let interval: NodeJS.Timeout
    
    if (processStage === 'success' && countdownTime > 0 && postSaveAction === 'stay') {
      interval = setInterval(() => {
        setCountdownTime(prev => {
          if (prev <= 1) {
            resetFormulario()
            setShowSuccess(false)
            setProcessStage('idle')
            return 6
          }
          return prev - 1
        })
      }, 1000)
    }
    
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [processStage, countdownTime, postSaveAction])
  
  const { createGasto, createReceita } = useTransacaoMutations({
    autoToast: false, // Desabilitar toast automático para controlar manualmente
    onSuccess: () => {
      // ✅ CORREÇÃO: Feedback visual robusto de sucesso
      setShowSuccess(true)
      
      // ✅ CORREÇÃO: Toast customizado mais informativo e atrativo
      toast({
        title: "🎉 Transação Salva com Sucesso!",
        description: (
          <div className="space-y-1">
            <p className="font-medium">{`${tipo === 'GASTO' ? 'Gasto' : 'Receita'}: ${formData.descricao}`}</p>
            <p className="text-sm opacity-90">{formatCurrency(formData.valor_total)} • {new Date(formData.data_transacao + 'T00:00:00').toLocaleDateString('pt-BR')}</p>
            {tipo === 'GASTO' && formData.participantes.length > 1 && (
              <p className="text-xs opacity-75">{formData.participantes.length} participante{formData.participantes.length > 1 ? 's' : ''}</p>
            )}
          </div>
        ),
        duration: 8000,
      })

      // ✅ CORREÇÃO: Comportamento baseado na preferência do usuário
      if (postSaveAction === 'stay') {
        // Permanecer no formulário - iniciar countdown
        setProcessStage('success')
        setProcessMessage('Transação salva com sucesso!')
        setCountdownTime(6)
      } else {
        // Redirecionar após um breve delay para mostrar sucesso
        setTimeout(() => {
          onSuccess?.()
        }, 2000)
      }
    },
    onError: (error) => {
      // Log estratégico para depuração
      if (process.env.NODE_ENV === 'development') {
        console.error('[TransacaoFormAvancado] Erro detalhado:', error)
      }
    }
  })
  
  // Estados do formulário
  const [formData, setFormData] = useState({
    descricao: initialData?.descricao || '',
    local: initialData?.local || '',
    valor_total: (() => {
      if (initialData) {
        const gasto = initialData as CreateGastoForm
        const receita = initialData as CreateReceitaForm
        return gasto.valor_total || receita.valor_recebido || 0
      }
      return 0
    })(),
    data_transacao: initialData?.data_transacao || new Date().toISOString().split('T')[0],
    observacoes: initialData?.observacoes || '',
    eh_parcelado: (initialData as CreateGastoForm)?.eh_parcelado || false,
    total_parcelas: (initialData as CreateGastoForm)?.total_parcelas || 1,
    participantes: (initialData as CreateGastoForm)?.participantes || [],
    tags: initialData?.tags || []
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  // Inicializar participante padrão (usuário logado)
  useEffect(() => {
    if (tipo === 'GASTO' && user && formData.participantes.length === 0) {
      setFormData(prev => ({
        ...prev,
        participantes: [{
          pessoa_id: Number(user.id),
          nome: user.nome,
          valor_devido: prev.valor_total
        }]
      }))
    }
  }, [tipo, user, formData.participantes.length, formData.valor_total])

  // Efeito para adicionar participante automaticamente em gastos
  useEffect(() => {
    // Se é um gasto e não tem participantes, adicionar o usuário logado automaticamente
    if (tipo === 'GASTO' && formData.participantes.length === 0 && formData.valor_total > 0 && user && pessoas.length > 0) {
      console.log('[TransacaoFormAvancado] Adicionando participante automático:', user.nome)
      const usuarioLogado = pessoas.find(p => p.id === Number(user.id))
      if (usuarioLogado) {
        const participanteAutomatico: ParticipanteForm = {
          pessoa_id: usuarioLogado.id,
          nome: usuarioLogado.nome,
          valor_devido: formData.valor_total
        }
        setFormData(prev => ({
          ...prev,
          participantes: [participanteAutomatico]
        }))
      }
    }
  }, [tipo, formData.valor_total, formData.participantes.length, user, pessoas])

  // Calcular valores automaticamente (DEVE vir antes dos useEffect que o usam)
  const calculosAutomaticos = useMemo(() => {
    const totalParticipantes = formData.participantes.reduce((acc, p) => acc + p.valor_devido, 0)
    const diferenca = formData.valor_total - totalParticipantes
    const valorRestante = Math.max(0, diferenca)
    const isBalanceado = Math.abs(diferenca) < 0.01

    return {
      totalParticipantes,
      diferenca,
      valorRestante,
      isBalanceado,
      valorPorPessoa: formData.participantes.length > 0 ? formData.valor_total / formData.participantes.length : 0
    }
  }, [formData.valor_total, formData.participantes])

  // Efeito para ajustar valores dos participantes quando valor total muda
  useEffect(() => {
    if (tipo === 'GASTO' && formData.participantes.length > 0 && formData.valor_total > 0) {
      // Ajustar valores automaticamente para manter balanceamento
      const valorPorPessoa = Math.round((formData.valor_total / formData.participantes.length) * 100) / 100
      let somaAcumulada = 0

      setFormData(prev => ({
        ...prev,
        participantes: prev.participantes.map((p, index) => {
          const valor = index === prev.participantes.length - 1 
            ? formData.valor_total - somaAcumulada // Último participante pega o resto
            : valorPorPessoa
          
          somaAcumulada += valorPorPessoa
          
          return { ...p, valor_devido: valor }
        })
      }))
    }
  }, [tipo, formData.valor_total, formData.participantes.length])

  // Atalhos de teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Enter = Salvar
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault()
        if (!isSubmitting && (calculosAutomaticos.isBalanceado || tipo === 'RECEITA')) {
          const form = document.querySelector('form') as HTMLFormElement
          if (form) {
            form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }))
          }
        }
        return
      }

      // Escape = Cancelar
      if (e.key === 'Escape') {
        e.preventDefault()
        onCancel?.()
        return
      }

      // Ctrl/Cmd + D = Dividir igualmente (apenas gastos)
      if ((e.ctrlKey || e.metaKey) && e.key === 'd' && tipo === 'GASTO') {
        e.preventDefault()
        dividirIgualmente()
        return
      }

      // Ctrl/Cmd + N = Novo participante (apenas gastos)
      if ((e.ctrlKey || e.metaKey) && e.key === 'n' && tipo === 'GASTO') {
        e.preventDefault()
        adicionarParticipante()
        return
      }

      // F1 = Mostrar/esconder atalhos
      if (e.key === 'F1') {
        e.preventDefault()
        setShowShortcuts(prev => !prev)
        return
      }

      // Tab navigation entre abas
      if (e.key === 'ArrowRight' && e.altKey) {
        e.preventDefault()
        const tabs = ['basico', 'participantes', 'tags', 'resumo']
        const currentIndex = tabs.indexOf(activeTab)
        const nextIndex = (currentIndex + 1) % tabs.length
        if (tabs[nextIndex] === 'participantes' && tipo === 'RECEITA') {
          setActiveTab('tags')
        } else {
          setActiveTab(tabs[nextIndex])
        }
        return
      }

      if (e.key === 'ArrowLeft' && e.altKey) {
        e.preventDefault()
        const tabs = ['basico', 'participantes', 'tags', 'resumo']
        const currentIndex = tabs.indexOf(activeTab)
        const prevIndex = currentIndex === 0 ? tabs.length - 1 : currentIndex - 1
        if (tabs[prevIndex] === 'participantes' && tipo === 'RECEITA') {
          setActiveTab('basico')
        } else {
          setActiveTab(tabs[prevIndex])
        }
        return
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [activeTab, tipo, isSubmitting, calculosAutomaticos.isBalanceado, onCancel])

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Limpar erro do campo
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleParticipanteChange = (index: number, field: keyof ParticipanteForm, value: any) => {
    setFormData(prev => ({
      ...prev,
      participantes: prev.participantes.map((p, i) => 
        i === index ? { ...p, [field]: value } : p
      )
    }))
  }

  const adicionarParticipante = () => {
    if (formData.participantes.length >= 10) {
      toast({
        title: "Limite atingido",
        description: "Máximo de 10 participantes por transação",
        variant: "destructive"
      })
      return
    }

    const pessoasDisponiveis = pessoas.filter(p => 
      !formData.participantes.some(part => part.pessoa_id === p.id)
    )

    if (pessoasDisponiveis.length === 0) {
      toast({
        title: "Sem pessoas disponíveis",
        description: "Todas as pessoas já estão participando desta transação",
        variant: "destructive"
      })
      return
    }

    const primeiraPessoa = pessoasDisponiveis[0]
    const novoParticipante: ParticipanteForm = {
      pessoa_id: primeiraPessoa.id,
      nome: primeiraPessoa.nome,
      valor_devido: calculosAutomaticos.valorRestante || 0
    }

    setFormData(prev => ({
      ...prev,
      participantes: [...prev.participantes, novoParticipante]
    }))
  }

  const removerParticipante = (index: number) => {
    if (formData.participantes.length <= 1) {
      toast({
        title: "Não é possível remover",
        description: "Deve haver pelo menos um participante",
        variant: "destructive"
      })
      return
    }

    setFormData(prev => ({
      ...prev,
      participantes: prev.participantes.filter((_, i) => i !== index)
    }))
  }

  const dividirIgualmente = () => {
    if (formData.participantes.length === 0) return

    const valorPorPessoa = Math.round((formData.valor_total / formData.participantes.length) * 100) / 100
    let somaAcumulada = 0

    setFormData(prev => ({
      ...prev,
      participantes: prev.participantes.map((p, index) => {
        const valor = index === prev.participantes.length - 1 
          ? formData.valor_total - somaAcumulada // Último participante pega o resto
          : valorPorPessoa
        
        somaAcumulada += valorPorPessoa
        
        return { ...p, valor_devido: valor }
      })
    }))
  }

  const resetFormulario = () => {
    setFormData({
      descricao: '',
      local: '',
      valor_total: 0,
      data_transacao: new Date().toISOString().split('T')[0],
      observacoes: '',
      eh_parcelado: false,
      total_parcelas: 1,
      participantes: [],
      tags: []
    })
    setActiveTab('basico')
    setErrors({})
    setShowSuccess(false)
    
    // Focar no campo descrição
    setTimeout(() => {
      const descricaoInput = document.getElementById('descricao')
      if (descricaoInput) {
        descricaoInput.focus()
      }
    }, 100)
  }

  const toggleTag = (tagId: number) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.includes(tagId)
        ? prev.tags.filter(id => id !== tagId)
        : [...prev.tags, tagId]
    }))
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    // Validações básicas
    if (!formData.descricao.trim()) {
      newErrors.descricao = 'Descrição é obrigatória'
    } else if (formData.descricao.length < 3) {
      newErrors.descricao = 'Descrição deve ter pelo menos 3 caracteres'
    }

    if (formData.valor_total <= 0) {
      newErrors.valor_total = 'Valor deve ser maior que zero'
    }

    // ✅ CORREÇÃO: Validação robusta de data
    if (!formData.data_transacao) {
      newErrors.data_transacao = 'Data é obrigatória'
    } else {
      const dataRegex = /^\d{4}-\d{2}-\d{2}$/
      if (!dataRegex.test(formData.data_transacao)) {
        newErrors.data_transacao = 'Data deve estar no formato YYYY-MM-DD'
      } else {
        const inputDate = new Date(formData.data_transacao)
        if (isNaN(inputDate.getTime())) {
          newErrors.data_transacao = 'Data inválida'
        } else {
          const year = inputDate.getFullYear()
          if (year < 2000 || year > 2050) {
            newErrors.data_transacao = 'Data deve estar entre os anos 2000 e 2050'
          } else {
            const today = new Date()
            today.setHours(23, 59, 59, 999)
            if (inputDate > today) {
              newErrors.data_transacao = 'Data não pode ser futura'
            }
          }
        }
      }
    }

    // Validações específicas para gastos
    if (tipo === 'GASTO') {
      if (formData.participantes.length === 0) {
        newErrors.participantes = 'Deve haver pelo menos um participante'
      }

      if (!calculosAutomaticos.isBalanceado) {
        newErrors.participantes = 'A soma dos valores dos participantes deve ser igual ao valor total'
      }

      if (formData.eh_parcelado && formData.total_parcelas < 2) {
        newErrors.total_parcelas = 'Para parcelamento, deve haver pelo menos 2 parcelas'
      }
    }

    if (formData.tags.length > 5) {
      newErrors.tags = 'Máximo de 5 tags por transação'
    }

    // ✅ CORREÇÃO: Atualizar estado e retornar resultado
    setErrors(newErrors)
    const isValid = Object.keys(newErrors).length === 0
    
    // Log estratégico apenas para depuração
    if (!isValid && process.env.NODE_ENV === 'development') {
      console.log('[TransacaoFormAvancado] Validação falhou:', newErrors)
    }
    
    return isValid
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // ✅ CORREÇÃO: Etapa 1 - Validação com feedback visual
    setProcessStage('validating')
    setProcessMessage('Validando dados do formulário...')
    
    // Delay artificial para usuário ver a validação
    await new Promise(resolve => setTimeout(resolve, 800))
    
    if (!validateForm()) {
      setProcessStage('error')
      setProcessMessage('Erro de validação encontrado')
      
      // ✅ CORREÇÃO: Aguardar um tick para que o estado errors seja atualizado
      setTimeout(() => {
        const primeiroErro = Object.values(errors)[0] || 'Verifique os campos obrigatórios'
        const totalErros = Object.keys(errors).length
        
        // ✅ CORREÇÃO: Feedback visual imediato com toast
        toast({
          title: "⚠️ Erro de Validação",
          description: totalErros > 1 
            ? `${primeiroErro} (e mais ${totalErros - 1} erro${totalErros > 2 ? 's' : ''})`
            : primeiroErro || 'Verifique os campos obrigatórios',
          variant: "destructive",
          duration: 5000,
        })
        
        // Ir para a aba com erro
        if (errors.descricao || errors.valor_total || errors.data_transacao) {
          setActiveTab('basico')
        } else if (errors.participantes) {
          setActiveTab('participantes')
        } else if (errors.tags) {
          setActiveTab('tags')
        }
        
        // Reset estado do processo
        setTimeout(() => {
          setProcessStage('idle')
          setProcessMessage('')
        }, 2000)
      }, 0)
      
      return
    }

    try {
      setIsSubmitting(true)
      
      // ✅ CORREÇÃO: Etapa 2 - Preparação dos dados
      setProcessStage('preparing')
      setProcessMessage(`Preparando dados do ${tipo.toLowerCase()}...`)
      await new Promise(resolve => setTimeout(resolve, 600))

      // ✅ CORREÇÃO: Etapa 3 - Enviando para servidor
      setProcessStage('sending')
      setProcessMessage('Enviando dados para o servidor...')
      await new Promise(resolve => setTimeout(resolve, 400))

      // ✅ CORREÇÃO: Etapa 4 - Processamento
      setProcessStage('processing')
      setProcessMessage('Processando transação...')

      if (tipo === 'GASTO') {
        const gastoData: CreateGastoForm = {
          descricao: formData.descricao,
          local: formData.local || undefined,
          valor_total: formData.valor_total,
          data_transacao: formData.data_transacao,
          observacoes: formData.observacoes || undefined,
          eh_parcelado: formData.eh_parcelado,
          total_parcelas: formData.eh_parcelado ? formData.total_parcelas : 1,
          participantes: formData.participantes,
          tags: formData.tags
        }

        await createGasto(gastoData)
      } else {
        const receitaData: CreateReceitaForm = {
          descricao: formData.descricao,
          local: formData.local || undefined,
          valor_recebido: formData.valor_total,
          data_transacao: formData.data_transacao,
          observacoes: formData.observacoes || undefined,
          tags: formData.tags
        }

        await createReceita(receitaData)
      }

      // ✅ CORREÇÃO: Sucesso é tratado no callback onSuccess do hook

    } catch (error: any) {
      setProcessStage('error')
      setProcessMessage('Erro ao salvar transação')
      
      // Log estratégico para depuração
      if (process.env.NODE_ENV === 'development') {
        console.error('[TransacaoFormAvancado] Erro ao criar transação:', error)
      }
      
      // ✅ CORREÇÃO: Toast de erro mais amigável
      toast({
        title: "❌ Erro ao Salvar",
        description: error.message || "Não foi possível salvar a transação. Tente novamente.",
        variant: "destructive",
        duration: 6000,
      })
      
      // Reset estado do processo após erro
      setTimeout(() => {
        setProcessStage('idle')
        setProcessMessage('')
      }, 3000)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Painel de Atalhos */}
      {showShortcuts && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Keyboard className="h-4 w-4" />
                Atalhos de Teclado
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowShortcuts(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Ctrl+Enter</kbd>
                  <span>Salvar transação</span>
                </div>
                <div className="flex justify-between">
                  <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Esc</kbd>
                  <span>Cancelar</span>
                </div>
                <div className="flex justify-between">
                  <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">F1</kbd>
                  <span>Mostrar/ocultar atalhos</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Alt+←/→</kbd>
                  <span>Navegar entre abas</span>
                </div>
                {tipo === 'GASTO' && (
                  <>
                    <div className="flex justify-between">
                      <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Ctrl+D</kbd>
                      <span>Dividir igualmente</span>
                    </div>
                    <div className="flex justify-between">
                      <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Ctrl+N</kbd>
                      <span>Novo participante</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ✅ CORREÇÃO: Feedback de Sucesso Melhorado */}
      {showSuccess && (
        <Card className="border-green-200 bg-gradient-to-r from-green-50 to-green-100 shadow-lg animate-in slide-in-from-top-4 duration-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-500 rounded-full animate-pulse">
                  <Check className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-green-800 mb-1">
                    🎉 {tipo === 'GASTO' ? 'Gasto' : 'Receita'} Salvo com Sucesso!
                  </h3>
                  <div className="space-y-1 text-sm text-green-700">
                    <p className="font-medium">{formData.descricao}</p>
                    <p>{formatCurrency(formData.valor_total)} • {new Date(formData.data_transacao + 'T00:00:00').toLocaleDateString('pt-BR')}</p>
                    <p className="text-green-600">Formulário será limpo em 4 segundos...</p>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetFormulario}
                  className="border-green-300 text-green-700 hover:bg-green-200 transition-colors"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Transação
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSuccess(false)}
                  className="text-green-600 hover:bg-green-200"
                >
                  <X className="h-4 w-4 mr-1" />
                  Fechar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ✅ CORREÇÃO: Painel de Preferências de Comportamento */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-full">
                <Settings className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium text-blue-800">Após Salvar a Transação</h3>
                <p className="text-sm text-blue-600">Escolha o que acontece depois de salvar</p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button
                type="button"
                variant={postSaveAction === 'stay' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPostSaveAction('stay')}
                className={`transition-all ${
                  postSaveAction === 'stay' 
                    ? 'bg-blue-600 text-white hover:bg-blue-700' 
                    : 'border-blue-300 text-blue-700 hover:bg-blue-100'
                }`}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Limpar e Continuar
              </Button>
              <Button
                type="button"
                variant={postSaveAction === 'redirect' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPostSaveAction('redirect')}
                className={`transition-all ${
                  postSaveAction === 'redirect' 
                    ? 'bg-blue-600 text-white hover:bg-blue-700' 
                    : 'border-blue-300 text-blue-700 hover:bg-blue-100'
                }`}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar à Lista
              </Button>
            </div>
          </div>
          
          <div className="mt-3 text-xs text-blue-600">
            {postSaveAction === 'stay' ? (
              '💡 Ideal para lançar várias transações seguidas - formulário será limpo automaticamente'
            ) : (
              '💡 Ideal para lançamentos únicos - você voltará para a lista de transações'
            )}
          </div>
        </CardContent>
      </Card>

      {/* ✅ CORREÇÃO: Painel de Processo em Tempo Real */}
      {processStage !== 'idle' && (
        <Card className={`border-2 transition-all duration-300 ${
          processStage === 'success' ? 'border-green-300 bg-green-50' :
          processStage === 'error' ? 'border-red-300 bg-red-50' :
          'border-blue-300 bg-blue-50'
        }`}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-full ${
                processStage === 'success' ? 'bg-green-500' :
                processStage === 'error' ? 'bg-red-500' :
                'bg-blue-500'
              }`}>
                {processStage === 'success' ? (
                  <Check className="h-6 w-6 text-white" />
                ) : processStage === 'error' ? (
                  <X className="h-6 w-6 text-white" />
                ) : (
                  <div className="h-6 w-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className={`text-lg font-semibold ${
                    processStage === 'success' ? 'text-green-800' :
                    processStage === 'error' ? 'text-red-800' :
                    'text-blue-800'
                  }`}>
                    {processStage === 'validating' && '🔍 Validando Dados'}
                    {processStage === 'preparing' && '📋 Preparando Transação'}
                    {processStage === 'sending' && '📤 Enviando para Servidor'}
                    {processStage === 'processing' && '⚙️ Processando'}
                    {processStage === 'success' && '✅ Concluído!'}
                    {processStage === 'error' && '❌ Erro Encontrado'}
                  </h3>
                  
                  {/* Progress steps */}
                  <div className="flex gap-1">
                    {['validating', 'preparing', 'sending', 'processing', 'success'].map((stage, index) => (
                      <div
                        key={stage}
                        className={`w-2 h-2 rounded-full transition-all duration-300 ${
                          ['validating', 'preparing', 'sending', 'processing', 'success'].indexOf(processStage) >= index
                            ? processStage === 'error' 
                              ? 'bg-red-400'
                              : processStage === 'success' 
                                ? 'bg-green-400' 
                                : 'bg-blue-400'
                            : 'bg-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                
                <p className={`text-sm ${
                  processStage === 'success' ? 'text-green-700' :
                  processStage === 'error' ? 'text-red-700' :
                  'text-blue-700'
                }`}>
                  {processMessage}
                </p>
                
                                 {processStage === 'success' && (
                                        <div className="mt-3 space-y-2">
                       {postSaveAction === 'stay' ? (
                         <>
                           <div className="flex items-center gap-2 text-xs text-green-600">
                             <div className="flex items-center gap-1">
                               <span>Formulário será limpo em:</span>
                               <div className="flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-800 font-bold text-xs">
                                 {countdownTime}
                               </div>
                               <span>segundo{countdownTime !== 1 ? 's' : ''}</span>
                             </div>
                           </div>
                           
                           {/* Barra de progresso do countdown */}
                           <div className="w-full bg-green-200 rounded-full h-1.5">
                             <div 
                               className="bg-green-500 h-1.5 rounded-full transition-all duration-1000 ease-linear"
                               style={{ width: `${(countdownTime / 6) * 100}%` }}
                             />
                           </div>
                         </>
                       ) : (
                         <div className="text-xs text-green-600">
                           🔄 Redirecionando para a lista de transações...
                         </div>
                       )}
                     </div>
                 )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ✅ CORREÇÃO: Painel de Erros Visível */}
      {Object.keys(errors).length > 0 && processStage === 'idle' && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-red-100 rounded-full">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-red-800 mb-2">
                  Corrija os erros abaixo para continuar:
                </h3>
                <ul className="space-y-1 text-sm text-red-700">
                  {Object.entries(errors).map(([field, message]) => (
                    <li key={field} className="flex items-center gap-2">
                      <div className="w-1 h-1 bg-red-400 rounded-full"></div>
                      <span className="font-medium capitalize">
                        {field === 'descricao' ? 'Descrição' :
                         field === 'valor_total' ? 'Valor' :
                         field === 'data_transacao' ? 'Data' :
                         field === 'participantes' ? 'Participantes' :
                         field === 'total_parcelas' ? 'Parcelas' :
                         field === 'tags' ? 'Tags' : field}:
                      </span>
                      <span>{message}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      {/* Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {tipo === 'GASTO' ? (
                <div className="p-2 bg-red-100 rounded-lg">
                  <CreditCard className="h-5 w-5 text-red-600" />
                </div>
              ) : (
                <div className="p-2 bg-green-100 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </div>
              )}
              <div>
                <CardTitle className="text-xl">
                  {tipo === 'GASTO' ? 'Novo Gasto' : 'Nova Receita'}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-muted-foreground">
                    {tipo === 'GASTO' 
                      ? 'Registre um novo gasto e divida entre participantes'
                      : 'Registre uma nova receita no sistema'
                    }
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowShortcuts(true)}
                    className="text-xs"
                  >
                    <Keyboard className="h-3 w-3 mr-1" />
                    F1
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Resumo rápido */}
            {formData.valor_total > 0 && (
              <div className="text-right">
                <div className="text-2xl font-bold text-primary">
                  {formatCurrency(formData.valor_total)}
                </div>
                {tipo === 'GASTO' && formData.participantes.length > 0 && (
                  <div className="text-sm text-muted-foreground">
                    {formData.participantes.length} participante{formData.participantes.length > 1 ? 's' : ''}
                  </div>
                )}
              </div>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Formulário em abas */}
      <Card>
        <CardContent className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basico" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Básico
              </TabsTrigger>
              {tipo === 'GASTO' && (
                <TabsTrigger value="participantes" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Participantes
                  {formData.participantes.length > 0 && (
                    <Badge variant="secondary" className="ml-1">
                      {formData.participantes.length}
                    </Badge>
                  )}
                </TabsTrigger>
              )}
              <TabsTrigger value="tags" className="flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Tags
                {formData.tags.length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {formData.tags.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="resumo" className="flex items-center gap-2">
                <Calculator className="h-4 w-4" />
                Resumo
              </TabsTrigger>
            </TabsList>

            <form onSubmit={handleSubmit}>
              {/* Aba Básico */}
              <TabsContent value="basico" className="space-y-4 mt-6">
                <div className="grid gap-6 lg:grid-cols-3 md:grid-cols-2">
                  {/* Descrição */}
                  <div className="space-y-2 lg:col-span-3 md:col-span-2">
                    <Label htmlFor="descricao" className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Descrição *
                    </Label>
                    <Input
                      id="descricao"
                      placeholder={tipo === 'GASTO' ? "Ex: Jantar no restaurante" : "Ex: Salário mensal"}
                      value={formData.descricao}
                      onChange={(e) => handleInputChange('descricao', e.target.value)}
                      className={errors.descricao ? 'border-red-500' : ''}
                    />
                    {errors.descricao && (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.descricao}
                      </p>
                    )}
                  </div>

                  {/* Local */}
                  <div className="space-y-2">
                    <Label htmlFor="local" className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      {tipo === 'GASTO' ? 'Local' : 'Fonte'}
                    </Label>
                    <Input
                      id="local"
                      placeholder={tipo === 'GASTO' ? "Ex: Restaurante Italiano" : "Ex: Empresa XYZ"}
                      value={formData.local}
                      onChange={(e) => handleInputChange('local', e.target.value)}
                    />
                  </div>

                  {/* Valor */}
                  <div className="space-y-2">
                    <Label htmlFor="valor" className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      {tipo === 'GASTO' ? 'Valor Total *' : 'Valor Recebido *'}
                    </Label>
                    <Input
                      id="valor"
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder="0,00"
                      value={formData.valor_total || ''}
                      onChange={(e) => handleInputChange('valor_total', parseFloat(e.target.value) || 0)}
                      className={errors.valor_total ? 'border-red-500' : ''}
                    />
                    {errors.valor_total && (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.valor_total}
                      </p>
                    )}
                  </div>

                  {/* Data */}
                  <div className="space-y-2">
                    <Label htmlFor="data" className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Data *
                    </Label>
                    <Input
                      id="data"
                      type="date"
                      value={formData.data_transacao}
                      onChange={(e) => handleInputChange('data_transacao', e.target.value)}
                      className={errors.data_transacao ? 'border-red-500' : ''}
                    />
                    {errors.data_transacao && (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.data_transacao}
                      </p>
                    )}
                  </div>

                  {/* Parcelamento (apenas para gastos) */}
                  {tipo === 'GASTO' && (
                    <div className="space-y-4 lg:col-span-3 md:col-span-2">
                      <Separator />
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="parcelado"
                          checked={formData.eh_parcelado}
                          onCheckedChange={(checked) => handleInputChange('eh_parcelado', checked)}
                        />
                        <Label htmlFor="parcelado" className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4" />
                          Parcelar este gasto
                        </Label>
                      </div>

                      {formData.eh_parcelado && (
                        <div className="grid gap-4 md:grid-cols-2 p-4 bg-muted/50 rounded-lg">
                          <div className="space-y-2">
                            <Label htmlFor="parcelas">Total de Parcelas *</Label>
                            <Select
                              value={formData.total_parcelas.toString()}
                              onValueChange={(value) => handleInputChange('total_parcelas', parseInt(value))}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Array.from({ length: 36 }, (_, i) => i + 1).map(num => (
                                  <SelectItem key={num} value={num.toString()}>
                                    {num}x de {formatCurrency(formData.valor_total / num)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {errors.total_parcelas && (
                              <p className="text-sm text-red-500">{errors.total_parcelas}</p>
                            )}
                          </div>
                          <div className="space-y-2">
                            <Label>Valor por Parcela</Label>
                            <div className="p-3 bg-background rounded border text-lg font-semibold">
                              {formatCurrency(formData.valor_total / formData.total_parcelas)}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Observações */}
                  <div className="space-y-2 lg:col-span-3 md:col-span-2">
                    <Label htmlFor="observacoes">Observações</Label>
                    <Textarea
                      id="observacoes"
                      placeholder="Observações adicionais..."
                      value={formData.observacoes}
                      onChange={(e) => handleInputChange('observacoes', e.target.value)}
                      className="min-h-[80px]"
                    />
                  </div>
                </div>
              </TabsContent>

              {/* Aba Participantes (apenas para gastos) */}
              {tipo === 'GASTO' && (
                <TabsContent value="participantes" className="space-y-4 mt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">Participantes do Gasto</h3>
                      <p className="text-sm text-muted-foreground">
                        Defina quem vai participar e quanto cada pessoa deve pagar
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={adicionarParticipante}
                      disabled={formData.participantes.length >= 10 || loadingPessoas}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar
                    </Button>
                  </div>

                  {/* Calculadora rápida */}
                  <Card className="bg-muted/50">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium">Calculadora Rápida</h4>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={dividirIgualmente}
                          disabled={formData.participantes.length === 0}
                        >
                          <Calculator className="h-4 w-4 mr-2" />
                          Dividir Igualmente
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Valor Total:</span>
                          <div className="font-semibold">{formatCurrency(formData.valor_total)}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Participantes:</span>
                          <div className="font-semibold">{formData.participantes.length}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Soma Atual:</span>
                          <div className={`font-semibold ${calculosAutomaticos.isBalanceado ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(calculosAutomaticos.totalParticipantes)}
                          </div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Diferença:</span>
                          <div className={`font-semibold ${calculosAutomaticos.isBalanceado ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(calculosAutomaticos.diferenca)}
                          </div>
                        </div>
                      </div>
                      {!calculosAutomaticos.isBalanceado && (
                        <div className="mt-3 p-2 bg-yellow-100 border border-yellow-300 rounded text-sm text-yellow-800">
                          <AlertCircle className="h-4 w-4 inline mr-1" />
                          A soma dos participantes deve ser igual ao valor total
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Lista de participantes */}
                  <div className="space-y-3">
                    {formData.participantes.map((participante, index) => {
                      const pessoa = pessoas.find(p => p.id === participante.pessoa_id)
                      return (
                        <Card key={index}>
                          <CardContent className="p-4">
                            <div className="flex items-center gap-4">
                              <Avatar className="h-10 w-10">
                                <AvatarFallback className={`text-white ${generateAvatarColor(participante.nome)}`}>
                                  {getInitials(participante.nome)}
                                </AvatarFallback>
                              </Avatar>
                              
                              <div className="flex-1 grid gap-4 lg:grid-cols-4 md:grid-cols-3">
                                <div className="space-y-2">
                                  <Label>Pessoa *</Label>
                                  <Select
                                    value={participante.pessoa_id.toString()}
                                    onValueChange={(value) => {
                                      const pessoaSelecionada = pessoas.find(p => p.id === parseInt(value))
                                      if (pessoaSelecionada) {
                                        handleParticipanteChange(index, 'pessoa_id', parseInt(value))
                                        handleParticipanteChange(index, 'nome', pessoaSelecionada.nome)
                                      }
                                    }}
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {pessoas
                                        .filter(p => 
                                          p.id === participante.pessoa_id || 
                                          !formData.participantes.some(part => part.pessoa_id === p.id)
                                        )
                                        .map(pessoa => (
                                          <SelectItem key={pessoa.id} value={pessoa.id.toString()}>
                                            <div className="flex items-center gap-2">
                                              <Avatar className="h-6 w-6">
                                                <AvatarFallback className={`text-xs text-white ${generateAvatarColor(pessoa.nome)}`}>
                                                  {getInitials(pessoa.nome)}
                                                </AvatarFallback>
                                              </Avatar>
                                              {pessoa.nome}
                                              {pessoa.eh_proprietario && (
                                                <Badge variant="secondary" className="text-xs">Proprietário</Badge>
                                              )}
                                            </div>
                                          </SelectItem>
                                        ))}
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div className="space-y-2">
                                  <Label>Valor Devido *</Label>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={participante.valor_devido || ''}
                                    onChange={(e) => handleParticipanteChange(index, 'valor_devido', parseFloat(e.target.value) || 0)}
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label>Percentual</Label>
                                  <div className="p-3 bg-muted rounded text-sm">
                                    {formData.valor_total > 0 
                                      ? `${((participante.valor_devido / formData.valor_total) * 100).toFixed(1)}%`
                                      : '0%'
                                    }
                                  </div>
                                </div>
                              </div>

                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removerParticipante(index)}
                                disabled={formData.participantes.length <= 1}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}

                    {formData.participantes.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Nenhum participante adicionado</p>
                        <p className="text-sm">Clique em "Adicionar" para incluir participantes</p>
                      </div>
                    )}
                  </div>

                  {errors.participantes && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                      <AlertCircle className="h-4 w-4 inline mr-1" />
                      {errors.participantes}
                    </div>
                  )}
                </TabsContent>
              )}

              {/* Aba Tags */}
              <TabsContent value="tags" className="space-y-4 mt-6">
                <div>
                  <h3 className="text-lg font-semibold">Tags e Categorias</h3>
                  <p className="text-sm text-muted-foreground">
                    Selecione até 5 tags para categorizar esta transação
                  </p>
                </div>

                {loadingTags ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div key={i} className="h-12 bg-muted animate-pulse rounded" />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {tags.map(tag => (
                      <Card
                        key={tag.id}
                        className={`cursor-pointer transition-all hover:shadow-md ${
                          formData.tags.includes(tag.id) 
                            ? 'ring-2 ring-primary bg-primary/5' 
                            : 'hover:bg-muted/50'
                        }`}
                        onClick={() => toggleTag(tag.id)}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: tag.cor }}
                            />
                            <span className="text-sm font-medium">{tag.nome}</span>
                            {formData.tags.includes(tag.id) && (
                              <Check className="h-4 w-4 text-primary ml-auto" />
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {formData.tags.length > 0 && (
                  <div className="space-y-2">
                    <Label>Tags Selecionadas:</Label>
                    <div className="flex flex-wrap gap-2">
                      {formData.tags.map(tagId => {
                        const tag = tags.find(t => t.id === tagId)
                        return tag ? (
                          <Badge key={tagId} variant="secondary" className="flex items-center gap-1">
                            <div 
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: tag.cor }}
                            />
                            {tag.nome}
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-4 w-4 p-0 hover:bg-transparent"
                              onClick={() => toggleTag(tagId)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </Badge>
                        ) : null
                      })}
                    </div>
                  </div>
                )}

                {formData.tags.length >= 5 && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-700">
                    <AlertCircle className="h-4 w-4 inline mr-1" />
                    Máximo de 5 tags por transação atingido
                  </div>
                )}

                {errors.tags && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                    <AlertCircle className="h-4 w-4 inline mr-1" />
                    {errors.tags}
                  </div>
                )}
              </TabsContent>

              {/* Aba Resumo */}
              <TabsContent value="resumo" className="space-y-4 mt-6">
                <div>
                  <h3 className="text-lg font-semibold">Resumo da Transação</h3>
                  <p className="text-sm text-muted-foreground">
                    Revise todos os dados antes de salvar
                  </p>
                </div>

                <div className="grid gap-6 lg:grid-cols-3 md:grid-cols-2">
                  {/* Informações Básicas */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Informações Básicas
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <span className="text-sm text-muted-foreground">Tipo:</span>
                        <div className="font-medium">{tipo === 'GASTO' ? 'Gasto' : 'Receita'}</div>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Descrição:</span>
                        <div className="font-medium">{formData.descricao || '-'}</div>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">{tipo === 'GASTO' ? 'Local:' : 'Fonte:'}</span>
                        <div className="font-medium">{formData.local || '-'}</div>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Valor:</span>
                        <div className="font-medium text-lg">{formatCurrency(formData.valor_total)}</div>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Data:</span>
                        <div className="font-medium">
                          {new Date(formData.data_transacao + 'T00:00:00').toLocaleDateString('pt-BR')}
                        </div>
                      </div>
                      {formData.eh_parcelado && (
                        <div>
                          <span className="text-sm text-muted-foreground">Parcelamento:</span>
                          <div className="font-medium">
                            {formData.total_parcelas}x de {formatCurrency(formData.valor_total / formData.total_parcelas)}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Participantes (apenas para gastos) */}
                  {tipo === 'GASTO' && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          Participantes ({formData.participantes.length})
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="space-y-1 max-h-32 overflow-y-auto">
                          {formData.participantes.map((p, i) => (
                            <div key={i} className="flex justify-between text-sm py-1">
                              <span className="truncate flex-1">{p.nome}</span>
                              <span className="font-medium ml-2">{formatCurrency(p.valor_devido)}</span>
                            </div>
                          ))}
                        </div>
                        <div className="pt-2 border-t">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Total calculado:</span>
                            <span className={`font-medium ${calculosAutomaticos.isBalanceado ? 'text-green-600' : 'text-red-600'}`}>
                              {formatCurrency(calculosAutomaticos.totalParticipantes)}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Diferença:</span>
                            <span className={`font-medium ${calculosAutomaticos.isBalanceado ? 'text-green-600' : 'text-red-600'}`}>
                              {formatCurrency(calculosAutomaticos.diferenca)}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Tags e Detalhes */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Tag className="h-4 w-4" />
                        Tags e Detalhes
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <span className="text-sm text-muted-foreground">Tags ({formData.tags.length}):</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {formData.tags.length > 0 ? (
                            formData.tags.map(tagId => {
                              const tag = tags.find(t => t.id === tagId)
                              return tag ? (
                                <Badge key={tagId} variant="secondary" className="text-xs">
                                  <div 
                                    className="w-2 h-2 rounded-full mr-1"
                                    style={{ backgroundColor: tag.cor }}
                                  />
                                  {tag.nome}
                                </Badge>
                              ) : null
                            })
                          ) : (
                            <span className="text-sm text-muted-foreground">Nenhuma tag</span>
                          )}
                        </div>
                      </div>

                      {formData.observacoes && (
                        <div>
                          <span className="text-sm text-muted-foreground">Observações:</span>
                          <div className="text-sm bg-muted p-2 rounded mt-1 max-h-20 overflow-y-auto">
                            {formData.observacoes}
                          </div>
                        </div>
                      )}

                      {tipo === 'GASTO' && formData.eh_parcelado && (
                        <div>
                          <span className="text-sm text-muted-foreground">Parcelamento:</span>
                          <div className="text-sm font-medium bg-blue-50 p-2 rounded mt-1">
                            {formData.total_parcelas}× de {formatCurrency(formData.valor_total / formData.total_parcelas)}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Status de validação */}
                <Card className={calculosAutomaticos.isBalanceado || tipo === 'RECEITA' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      {calculosAutomaticos.isBalanceado || tipo === 'RECEITA' ? (
                        <>
                          <Check className="h-5 w-5 text-green-600" />
                          <span className="text-green-700 font-medium">Pronto para salvar</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-5 w-5 text-red-600" />
                          <span className="text-red-700 font-medium">Verificar participantes</span>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Botões de ação */}
              <div className="flex flex-col sm:flex-row justify-between sm:justify-end gap-3 pt-6 border-t">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={onCancel}
                  disabled={isSubmitting}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancelar
                </Button>
                <Button 
                  type="submit"
                  disabled={isSubmitting || (!calculosAutomaticos.isBalanceado && tipo === 'GASTO') || processStage !== 'idle'}
                  className={`min-w-[160px] transition-all duration-300 ${
                    processStage === 'success' ? 'bg-green-600 hover:bg-green-700' :
                    processStage === 'error' ? 'bg-red-600 hover:bg-red-700' :
                    processStage !== 'idle' ? 'bg-blue-600 hover:bg-blue-700' :
                    ''
                  }`}
                >
                  {processStage === 'validating' ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Validando...
                    </>
                  ) : processStage === 'preparing' ? (
                    <>
                      <div className="animate-pulse h-4 w-4 bg-white rounded mr-2" />
                      Preparando...
                    </>
                  ) : processStage === 'sending' ? (
                    <>
                      <div className="animate-bounce h-4 w-4 bg-white rounded mr-2" />
                      Enviando...
                    </>
                  ) : processStage === 'processing' ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Processando...
                    </>
                  ) : processStage === 'success' ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Salvo! ({countdownTime}s)
                    </>
                  ) : processStage === 'error' ? (
                    <>
                      <X className="h-4 w-4 mr-2" />
                      Erro!
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Salvar {tipo === 'GASTO' ? 'Gasto' : 'Receita'}
                      <kbd className="ml-2 px-1 py-0.5 bg-white/20 rounded text-xs">
                        Ctrl+↵
                      </kbd>
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
} 