'use client'

import React, { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Settings, 
  Save, 
  Palette, 
  Sun, 
  Moon, 
  Computer,
  Check,
  Crown,
  AlertCircle
} from 'lucide-react'
import { api } from '@/lib/api'
import { toast } from '@/hooks/use-toast'
import { useAuth } from '@/lib/auth'
import type { ConfiguracaoInterface, Theme } from '@/types'

// Mapeamento de ícones e cores para temas
const themeConfig = {
  light: { icon: Sun, color: '#ffffff', border: '#e2e8f0' },
  dark: { icon: Moon, color: '#0a0a0a', border: '#1e293b' },
  system: { icon: Computer, color: '#64748b', border: '#64748b' },
  blue: { icon: Palette, color: '#3b82f6', border: '#3b82f6' },
  green: { icon: Palette, color: '#10b981', border: '#10b981' },
  purple: { icon: Palette, color: '#8b5cf6', border: '#8b5cf6' },
  orange: { icon: Palette, color: '#f59e0b', border: '#f59e0b' },
}

export default function ConfiguracoesPage() {
  const { theme, setTheme } = useTheme()
  const { user } = useAuth()
  const [configuracao, setConfiguracao] = useState<ConfiguracaoInterface | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [selectedTheme, setSelectedTheme] = useState<Theme>('light')

  // Carregar configurações atuais
  useEffect(() => {
    const carregarConfiguracoes = async () => {
      try {
        const response = await api.get<ConfiguracaoInterface>('/configuracoes/interface')
        setConfiguracao(response.data)
        setSelectedTheme(response.data.theme_interface)
      } catch (error) {
        console.error('Erro ao carregar configurações:', error)
        toast({
          title: "Erro ao carregar configurações",
          description: "Não foi possível carregar as preferências do sistema.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    carregarConfiguracoes()
  }, [])

  // Salvar configurações
  const salvarConfiguracoes = async () => {
    if (!user?.eh_proprietario) {
      toast({
        title: "Sem permissão",
        description: "Apenas proprietários podem alterar configurações do sistema.",
        variant: "destructive",
      })
      return
    }

    if (isSaving) return

    setIsSaving(true)

    try {
      await api.put('/configuracoes/interface', {
        theme_interface: selectedTheme
      })

      // Aplicar tema na UI
      setTheme(selectedTheme)

      const temaNome = configuracao?.temas_disponíveis?.[selectedTheme]?.nome || selectedTheme
      
      toast({
        title: "Configurações salvas!",
        description: `Tema "${temaNome}" aplicado com sucesso.`,
        duration: 3000,
      })

      // Recarregar configurações
      const response = await api.get<ConfiguracaoInterface>('/configuracoes/interface')
      setConfiguracao(response.data)

    } catch (error) {
      console.error('Erro ao salvar configurações:', error)
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as configurações.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Preview do tema
  const previewTheme = (newTheme: Theme) => {
    setSelectedTheme(newTheme)
    setTheme(newTheme) // Aplicar imediatamente para preview
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
            <p className="text-muted-foreground">
              Carregando preferências do sistema...
            </p>
          </div>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
          <p className="text-muted-foreground">
            Personalize as preferências do sistema
          </p>
        </div>
        <div className="flex items-center gap-2">
          {user?.eh_proprietario ? (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Crown className="w-3 h-3" />
              Proprietário
            </Badge>
          ) : (
            <Badge variant="outline" className="flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              Somente Leitura
            </Badge>
          )}
          {user?.eh_proprietario && (
            <Button 
              onClick={salvarConfiguracoes}
              disabled={isSaving || selectedTheme === configuracao?.theme_interface}
            >
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          )}
        </div>
      </div>

      {/* Configurações de Tema */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5" />
            Aparência e Tema
          </CardTitle>
          <CardDescription>
            Escolha o tema que melhor se adapta às suas preferências. 
            {!user?.eh_proprietario && " Apenas proprietários podem salvar alterações."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Tema Atual */}
          <div>
            <h4 className="text-sm font-medium mb-3">Tema Atual</h4>
            <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/50">
              {configuracao?.theme_interface && themeConfig[configuracao.theme_interface] && (
                <>
                  <div 
                    className="w-4 h-4 rounded-full border-2"
                    style={{ 
                      backgroundColor: themeConfig[configuracao.theme_interface].color,
                      borderColor: themeConfig[configuracao.theme_interface].border
                    }}
                  />
                  <span className="font-medium">
                    {configuracao.temas_disponíveis?.[configuracao.theme_interface]?.nome || configuracao.theme_interface}
                  </span>
                  <Badge variant="outline" className="ml-auto">Ativo</Badge>
                </>
              )}
            </div>
          </div>

          <Separator />

          {/* Seleção de Temas */}
          <div>
            <h4 className="text-sm font-medium mb-4">Escolher Tema</h4>
            
            {/* Temas Padrão */}
            <div className="space-y-4">
              <div>
                <h5 className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">
                  Temas Padrão
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {(['light', 'dark', 'system'] as Theme[]).map((themeKey) => {
                    const themeInfo = configuracao?.temas_disponíveis?.[themeKey]
                    const config = themeConfig[themeKey]
                    const IconComponent = config.icon
                    
                    return (
                      <button
                        key={themeKey}
                        onClick={() => previewTheme(themeKey)}
                        disabled={!user?.eh_proprietario}
                        className={`
                          relative p-4 rounded-lg border-2 transition-all text-left
                          ${selectedTheme === themeKey 
                            ? 'border-primary bg-primary/5' 
                            : 'border-border hover:border-muted-foreground/50'
                          }
                          ${!user?.eh_proprietario ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:bg-muted/50'}
                        `}
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <div 
                            className="w-5 h-5 rounded-full border-2"
                            style={{ 
                              backgroundColor: config.color,
                              borderColor: config.border
                            }}
                          />
                          <IconComponent className="w-4 h-4" />
                          <span className="font-medium">{themeInfo?.nome || themeKey}</span>
                          {selectedTheme === themeKey && (
                            <Check className="w-4 h-4 ml-auto text-primary" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {themeInfo?.descricao || `Tema ${themeKey}`}
                        </p>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Temas Personalizados */}
              <div>
                <h5 className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">
                  Temas Personalizados
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  {(['blue', 'green', 'purple', 'orange'] as Theme[]).map((themeKey) => {
                    const themeInfo = configuracao?.temas_disponíveis?.[themeKey]
                    const config = themeConfig[themeKey]
                    const IconComponent = config.icon
                    
                    return (
                      <button
                        key={themeKey}
                        onClick={() => previewTheme(themeKey)}
                        disabled={!user?.eh_proprietario}
                        className={`
                          relative p-4 rounded-lg border-2 transition-all text-left
                          ${selectedTheme === themeKey 
                            ? 'border-primary bg-primary/5' 
                            : 'border-border hover:border-muted-foreground/50'
                          }
                          ${!user?.eh_proprietario ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:bg-muted/50'}
                        `}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <div 
                            className="w-5 h-5 rounded-full border-2"
                            style={{ 
                              backgroundColor: config.color,
                              borderColor: config.border
                            }}
                          />
                          <span className="font-medium text-sm">{themeInfo?.nome || themeKey}</span>
                          {selectedTheme === themeKey && (
                            <Check className="w-3 h-3 ml-auto text-primary" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {themeInfo?.descricao || `Tema ${themeKey} personalizado`}
                        </p>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Informações */}
          {!user?.eh_proprietario && (
            <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50 border">
              <AlertCircle className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium">Permissões Limitadas</p>
                <p className="text-xs text-muted-foreground">
                  Você pode visualizar e testar os temas, mas apenas proprietários podem salvar as alterações permanentemente.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Outras Configurações (Futuras) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Outras Configurações
          </CardTitle>
          <CardDescription>
            Funcionalidades adicionais serão implementadas em versões futuras.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Settings className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <h3 className="font-medium mb-2">Em Desenvolvimento</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Configurações de notificações, moeda, idioma e outras preferências serão adicionadas em breve.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <Badge variant="outline">Notificações</Badge>
              <Badge variant="outline">Moeda Padrão</Badge>
              <Badge variant="outline">Idioma</Badge>
              <Badge variant="outline">Backup</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 