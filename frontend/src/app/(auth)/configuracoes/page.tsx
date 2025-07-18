"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { configuracoesApi } from "@/lib/api";
import { IntegrationTestPanel } from "@/components/test/IntegrationTestPanel";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Building2, Plus } from "lucide-react";

const schema = z.object({
  theme_interface: z.enum(["light", "dark", "auto"], {
    required_error: "Selecione um tema."
  })
});

type ConfiguracoesFormData = z.infer<typeof schema>;

export default function ConfiguracoesPage() {
  const { toast } = useToast();
  const { createHub, hubsDisponiveis } = useAuth();
  const [activeTab, setActiveTab] = useState("configuracoes");
  const [showCreateHubModal, setShowCreateHubModal] = useState(false);
  const [newHubName, setNewHubName] = useState("");
  const [isCreatingHub, setIsCreatingHub] = useState(false);
  
  const form = useForm<ConfiguracoesFormData>({
    resolver: zodResolver(schema),
    defaultValues: { theme_interface: "light" }
  });

  // Carregar configurações atuais ao montar
  useEffect(() => {
    configuracoesApi.getInterface()
      .then((res) => {
        // Mapeamento flexível: aceita tanto 'theme_interface' quanto 'tema' do backend
        const data = res.data as { theme_interface?: string; tema?: string };
        const theme = data?.theme_interface || data?.tema;
        if (theme === 'auto' || theme === 'light' || theme === 'dark') {
          form.reset({ theme_interface: theme });
        }
      })
      .catch(() => {
        toast({ title: "Erro ao carregar configurações", variant: "destructive" });
      });
    // eslint-disable-next-line
  }, []);

  const onSubmit = async (data: ConfiguracoesFormData) => {
    try {
      await configuracoesApi.updateInterface({ theme_interface: data.theme_interface });
      toast({ title: "Configuração salva com sucesso!" });
    } catch {
      toast({ title: "Erro ao salvar configuração", variant: "destructive" });
    }
  };

  const handleCreateHub = async () => {
    if (!newHubName.trim()) return;
    
    setIsCreatingHub(true);
    try {
      await createHub(newHubName.trim());
      toast({ title: "Hub criado com sucesso!" });
      setShowCreateHubModal(false);
      setNewHubName("");
    } catch {
      toast({ title: "Erro ao criar hub", variant: "destructive" });
    } finally {
      setIsCreatingHub(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-10">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="configuracoes">Configurações</TabsTrigger>
          <TabsTrigger value="hubs">Gerenciar Hubs</TabsTrigger>
          <TabsTrigger value="testes">Testes de Integração</TabsTrigger>
        </TabsList>

        <TabsContent value="configuracoes" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configurações do Sistema</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="theme_interface">Tema da Interface</Label>
                  <Select
                    value={form.watch("theme_interface")}
                    onValueChange={value => form.setValue("theme_interface", value as "light" | "dark" | "auto")}
                    disabled={form.formState.isSubmitting}
                  >
                    <SelectTrigger id="theme_interface">
                      <SelectValue placeholder="Selecione o tema" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Claro</SelectItem>
                      <SelectItem value="dark">Escuro</SelectItem>
                      <SelectItem value="auto">Automático</SelectItem>
                    </SelectContent>
                  </Select>
                  {form.formState.errors.theme_interface && (
                    <p className="text-sm text-red-500">{form.formState.errors.theme_interface.message}</p>
                  )}
                </div>

                {/* Espaço para futuras opções (idioma, moeda, notificações, etc) */}
                <div className="space-y-2 opacity-50 cursor-not-allowed">
                  <Label>Idioma, Moeda, Notificações</Label>
                  <p className="text-xs text-muted-foreground">Em breve você poderá personalizar mais opções aqui.</p>
                </div>

                <Button type="submit" disabled={form.formState.isSubmitting} className="w-full">
                  {form.formState.isSubmitting ? "Salvando..." : "Salvar Configurações"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hubs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Building2 className="h-5 w-5" />
                  <span>Gerenciar Hubs</span>
                </div>
                <Button
                  onClick={() => setShowCreateHubModal(true)}
                  className="flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Criar Hub</span>
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {hubsDisponiveis?.map((hub) => (
                  <div
                    key={hub.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <Building2 className="h-5 w-5 text-blue-600" />
                      <div>
                        <h3 className="font-medium">{hub.nome}</h3>
                        <Badge variant="secondary" className="text-xs">
                          {hub.role === 'PROPRIETARIO' ? 'Proprietário' : 
                           hub.role === 'ADMINISTRADOR' ? 'Administrador' :
                           hub.role === 'COLABORADOR' ? 'Colaborador' : 'Visualizador'}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm">
                        Gerenciar
                      </Button>
                    </div>
                  </div>
                ))}
                
                {hubsDisponiveis?.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Building2 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>Nenhum hub encontrado.</p>
                    <p className="text-sm">Clique em &quot;Criar Hub&quot; para começar.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="testes" className="space-y-6">
          <IntegrationTestPanel />
        </TabsContent>
      </Tabs>

      {/* Modal para criar novo hub */}
      {showCreateHubModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Criar Novo Hub</h3>
            <Input
              placeholder="Nome do Hub"
              value={newHubName}
              onChange={(e) => setNewHubName(e.target.value)}
              disabled={isCreatingHub}
              maxLength={50}
              className="mb-4"
            />
            <div className="flex space-x-2">
              <Button
                onClick={handleCreateHub}
                disabled={isCreatingHub || !newHubName.trim()}
                className="flex-1"
              >
                {isCreatingHub ? 'Criando...' : 'Criar Hub'}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateHubModal(false);
                  setNewHubName("");
                }}
                disabled={isCreatingHub}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 