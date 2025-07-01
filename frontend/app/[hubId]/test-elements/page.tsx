"use client";
import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert } from "@/components/ui/alert";
import { Avatar } from "@/components/ui/avatar";
import { Modal } from "@/components/ui/modal";
import { Tabs } from "@/components/ui/tabs";
import { Stepper } from "@/components/ui/stepper";
import { Tooltip } from "@/components/ui/tooltip";
import { StatCard } from "@/components/ui/stat-card";
import { ChartWidget } from "@/components/ui/chart-widget";
import { Switch } from "@/components/ui/switch";
import { Timeline } from "@/components/ui/timeline";
import { DataTable } from "@/components/ui/data-table";
import { Form, FormField } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dropdown } from "@/components/ui/dropdown";
import { Accordion } from "@/components/ui/accordion";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Notification } from "@/components/ui/notification";
import { useToast, ToastContainer } from "@/lib/hooks/useToast";
import { BarChart, Sparkles, Loader2, DollarSign, Users, TrendingUp, Settings, Moon, Sun, Eye, CheckCircle, AlertCircle, XCircle, ChevronDown, Info } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TestElementsPage() {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [currentStep, setCurrentStep] = useState(1);
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortColumn, setSortColumn] = useState<string>("");
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Dados para tabela
  const tableData = [
    { id: 1, name: "João Silva", email: "joao@email.com", status: "Ativo", role: "Admin", date: "2024-01-15" },
    { id: 2, name: "Maria Santos", email: "maria@email.com", status: "Ativo", role: "User", date: "2024-01-16" },
    { id: 3, name: "Pedro Costa", email: "pedro@email.com", status: "Inativo", role: "User", date: "2024-01-17" },
    { id: 4, name: "Ana Oliveira", email: "ana@email.com", status: "Ativo", role: "Admin", date: "2024-01-18" },
  ];

  const tableColumns = [
    { key: "name", header: "Nome", accessor: (item: any) => item.name, sortable: true },
    { key: "email", header: "Email", accessor: (item: any) => item.email, sortable: true },
    { key: "status", header: "Status", accessor: (item: any) => (
      <Badge variant={item.status === "Ativo" ? "success" : "secondary"}>
        {item.status}
      </Badge>
    )},
    { key: "role", header: "Função", accessor: (item: any) => item.role, sortable: true },
    { key: "date", header: "Data", accessor: (item: any) => item.date, sortable: true },
  ];

  // Dados para gráficos
  const chartData = [
    { label: "Jan", value: 65 },
    { label: "Fev", value: 78 },
    { label: "Mar", value: 90 },
    { label: "Abr", value: 81 },
    { label: "Mai", value: 95 },
    { label: "Jun", value: 88 },
  ];

  // Dados para timeline
  const timelineItems = [
    {
      id: "1",
      title: "Configuração inicial",
      description: "Hub criado e configurado com sucesso",
      date: "Hoje, 10:30",
      status: "completed" as const,
    },
    {
      id: "2",
      title: "Convite de membros",
      description: "Enviando convites para colaboradores",
      date: "Hoje, 11:15",
      status: "pending" as const,
    },
    {
      id: "3",
      title: "Primeira transação",
      description: "Aguardando primeira entrada de dados",
      date: "Em breve",
      status: "warning" as const,
    },
  ];

  // Tabs para demonstração
  const tabs = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: <BarChart className="w-4 h-4" />,
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground">Visualize suas métricas principais aqui.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard
              title="Receita Total"
              value="R$ 12.450"
              change={12.5}
              trend="up"
              icon={<DollarSign className="w-5 h-5" />}
            />
            <StatCard
              title="Membros Ativos"
              value="24"
              change={-2.1}
              trend="down"
              icon={<Users className="w-5 h-5" />}
            />
            <StatCard
              title="Crescimento"
              value="+18.3%"
              change={18.3}
              trend="up"
              icon={<TrendingUp className="w-5 h-5" />}
            />
          </div>
        </div>
      ),
    },
    {
      id: "analytics",
      label: "Analytics",
      icon: <TrendingUp className="w-4 h-4" />,
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground">Análises detalhadas e gráficos.</p>
          <ChartWidget
            data={chartData}
            type="line"
            title="Receita Mensal"
            height={200}
          />
        </div>
      ),
    },
    {
      id: "settings",
      label: "Configurações",
      icon: <Settings className="w-4 h-4" />,
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground">Configure suas preferências.</p>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Moon className="w-4 h-4" />
                <span>Modo Escuro</span>
              </div>
              <Switch
                checked={darkMode}
                onCheckedChange={setDarkMode}
                icons={{
                  checked: <Moon className="w-3 h-3" />,
                  unchecked: <Sun className="w-3 h-3" />,
                }}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4" />
                <span>Notificações</span>
              </div>
              <Switch
                checked={notifications}
                onCheckedChange={setNotifications}
              />
            </div>
          </div>
        </div>
      ),
    },
  ];

  // Steps para stepper
  const steps = [
    { id: "1", title: "Criar Hub", description: "Configuração inicial" },
    { id: "2", title: "Convidar", description: "Adicionar membros" },
    { id: "3", title: "Configurar", description: "Definir permissões" },
    { id: "4", title: "Finalizar", description: "Começar a usar" },
  ];

  // Campos para formulário
  const formFields: FormField[] = [
    { name: "name", label: "Nome", type: "text", required: true, placeholder: "Digite seu nome" },
    { name: "email", label: "Email", type: "email", required: true, placeholder: "seu@email.com" },
    { name: "phone", label: "Telefone", type: "text", placeholder: "(11) 99999-9999" },
    { name: "age", label: "Idade", type: "number", validation: { min: 18, max: 100 } },
    { name: "category", label: "Categoria", type: "select", options: [
      { value: "pessoal", label: "Pessoal" },
      { value: "trabalho", label: "Trabalho" },
      { value: "estudo", label: "Estudo" }
    ]},
    { name: "description", label: "Descrição", type: "textarea", placeholder: "Descreva aqui..." },
    { name: "newsletter", label: "Receber newsletter", type: "checkbox" },
  ];

  // Dropdown items para demonstração
  const dropdownItems = [
    { id: "profile", label: "Perfil", icon: <CheckCircle className="w-4 h-4" />, onClick: () => toast.info("Perfil") },
    { id: "settings", label: "Configurações", icon: <Settings className="w-4 h-4" />, onClick: () => toast.info("Configurações") },
    { id: "separator1", label: "", separator: true },
    { id: "help", label: "Ajuda", icon: <AlertCircle className="w-4 h-4" />, onClick: () => toast.info("Ajuda") },
    { id: "logout", label: "Sair", icon: <XCircle className="w-4 h-4" />, onClick: () => toast.info("Saindo...") },
  ];

  // Accordion items para demonstração
  const accordionItems = [
    {
      id: "section1",
      title: "Configurações Gerais",
      content: "Configure as opções básicas do sistema.",
    },
    {
      id: "section2",
      title: "Preferências de Notificação",
      content: "Defina como e quando receber notificações.",
    },
    {
      id: "section3",
      title: "Integrações",
      content: "Conecte com outros serviços e aplicações.",
    },
  ];

  // Breadcrumb items para demonstração
  const breadcrumbItems = [
    { id: "dashboard", label: "Dashboard", onClick: () => toast.info("Dashboard") },
    { id: "financeiro", label: "Financeiro", onClick: () => toast.info("Financeiro") },
    { id: "relatorios", label: "Relatórios", onClick: () => toast.info("Relatórios") },
  ];

  // Handler para simular loading
  const handleSimulateLoading = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 2000);
  };

  // Handler para mostrar toast animado
  const handleShowToast = () => {
    toast.success("Toast animado!", "Este toast usa animação suave para feedback.", 2500);
  };

  // Handler para ordenação da tabela
  const handleSort = (key: string, direction: 'asc' | 'desc') => {
    setSortColumn(key);
    setSortDirection(direction);
  };

  // Handler para formulário
  const handleFormSubmit = (data: Record<string, any>) => {
    console.log("Dados do formulário:", data);
    toast.success("Formulário enviado!", "Dados processados com sucesso.");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 py-12 px-2">
      <div className="max-w-6xl w-full space-y-10">
        {/* Título e badge */}
        <div className="text-center space-y-2">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-primary/80 to-accent/80 text-white text-xs font-semibold shadow-md animate-fade-in">
            <Sparkles className="h-4 w-4" /> Showcase Visual Completo
          </span>
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent animate-fade-in-up">
            Componentes Avançados
          </h1>
          <p className="text-muted-foreground text-lg animate-fade-in-up">
            Experimente todos os componentes com glassmorphism, animações e interatividade.
          </p>
        </div>

        {/* Alertas */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-center">Alertas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Alert
              type="success"
              title="Operação Concluída"
              description="Sua transação foi processada com sucesso."
              onClose={() => toast.info("Alerta fechado")}
            />
            <Alert
              type="error"
              title="Erro de Conexão"
              description="Não foi possível conectar ao servidor."
            />
            <Alert
              type="warning"
              title="Atenção"
              description="Você tem transações pendentes de revisão."
            />
            <Alert
              type="info"
              title="Nova Funcionalidade"
              description="Explore os novos recursos disponíveis."
            />
          </div>
        </div>

        {/* Avatars */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-center">Avatars</h2>
          <div className="flex flex-wrap justify-center gap-6">
            <Avatar name="João Silva" status="online" role="PROPRIETARIO" />
            <Avatar name="Maria Santos" status="busy" role="ADMINISTRADOR" />
            <Avatar name="Pedro Costa" status="offline" role="COLABORADOR" />
            <Avatar name="Ana Oliveira" status="online" role="VISUALIZADOR" />
          </div>
        </div>

        {/* Tabs */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-center">Tabs</h2>
          <Card glass className="border border-white/20 shadow-xl">
            <CardContent className="pt-6">
              <Tabs
                tabs={tabs}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                variant="card"
              />
            </CardContent>
          </Card>
        </div>

        {/* Stepper */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-center">Stepper</h2>
          <Card glass className="border border-white/20 shadow-xl">
            <CardContent className="pt-6">
              <Stepper
                steps={steps}
                currentStep={currentStep}
                onStepClick={setCurrentStep}
              />
              <div className="flex justify-center mt-6 gap-2">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                  disabled={currentStep === 0}
                >
                  Anterior
                </Button>
                <Button
                  onClick={() => setCurrentStep(Math.min(steps.length - 1, currentStep + 1))}
                  disabled={currentStep === steps.length - 1}
                >
                  Próximo
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tooltips */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-center">Tooltips</h2>
          <div className="flex flex-wrap justify-center gap-4">
            <Tooltip content="Informação adicional sobre este botão" position="top">
              <Button variant="outline">Hover para tooltip</Button>
            </Tooltip>
            <Tooltip content="Dica lateral esquerda" position="left">
              <Button variant="outline">Tooltip Esquerda</Button>
            </Tooltip>
            <Tooltip content="Dica lateral direita" position="right">
              <Button variant="outline">Tooltip Direita</Button>
            </Tooltip>
            <Tooltip content="Dica inferior" position="bottom">
              <Button variant="outline">Tooltip Baixo</Button>
            </Tooltip>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-center">Stat Cards</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard
              title="Receita Total"
              value="R$ 12.450"
              change={12.5}
              trend="up"
              icon={<DollarSign className="w-5 h-5" />}
            />
            <StatCard
              title="Membros Ativos"
              value="24"
              change={-2.1}
              trend="down"
              icon={<Users className="w-5 h-5" />}
            />
            <StatCard
              title="Crescimento"
              value="+18.3%"
              change={18.3}
              trend="up"
              icon={<TrendingUp className="w-5 h-5" />}
            />
          </div>
        </div>

        {/* Chart Widget */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-center">Gráficos</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ChartWidget
              data={chartData}
              type="line"
              title="Receita Mensal"
              height={200}
            />
            <ChartWidget
              data={chartData}
              type="bar"
              title="Vendas por Mês"
              height={200}
            />
          </div>
        </div>

        {/* Switches */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-center">Switches</h2>
          <Card glass className="border border-white/20 shadow-xl">
            <CardContent className="pt-6">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Moon className="w-4 h-4" />
                    <span>Modo Escuro</span>
                  </div>
                  <Switch
                    checked={darkMode}
                    onCheckedChange={setDarkMode}
                    icons={{
                      checked: <Moon className="w-3 h-3" />,
                      unchecked: <Sun className="w-3 h-3" />,
                    }}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    <span>Notificações</span>
                  </div>
                  <Switch
                    checked={notifications}
                    onCheckedChange={setNotifications}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    <span>Configurações Avançadas</span>
                  </div>
                  <Switch checked={false} onCheckedChange={() => {}} disabled />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Timeline */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-center">Timeline</h2>
          <Card glass className="border border-white/20 shadow-xl">
            <CardContent className="pt-6">
              <Timeline items={timelineItems} />
            </CardContent>
          </Card>
        </div>

        {/* Badges */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-center">Badges</h2>
          <div className="flex flex-wrap justify-center gap-4">
            <Badge variant="default" icon={<CheckCircle className="w-4 h-4" />}>
              Padrão
            </Badge>
            <Badge variant="secondary">
              Secundário
            </Badge>
            <Badge variant="destructive" icon={<XCircle className="w-4 h-4" />}>
              Erro
            </Badge>
            <Badge variant="outline">
              Outline
            </Badge>
            <Badge variant="success" icon={<CheckCircle className="w-4 h-4" />}>
              Sucesso
            </Badge>
            <Badge variant="warning" icon={<AlertCircle className="w-4 h-4" />}>
              Aviso
            </Badge>
          </div>
          <div className="flex flex-wrap justify-center gap-4">
            <Badge size="sm">Pequeno</Badge>
            <Badge size="md">Médio</Badge>
            <Badge size="lg">Grande</Badge>
          </div>
        </div>

        {/* Progress */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-center">Progress Bars</h2>
          <div className="space-y-6">
            <div className="space-y-4">
              <Progress value={75} label="Progresso Padrão" showValue />
              <Progress value={45} variant="success" label="Sucesso" showValue />
              <Progress value={85} variant="warning" label="Atenção" showValue />
              <Progress value={30} variant="error" label="Erro" showValue />
            </div>
            <div className="space-y-4">
              <Progress value={60} size="sm" label="Pequeno" />
              <Progress value={60} size="md" label="Médio" />
              <Progress value={60} size="lg" label="Grande" />
            </div>
          </div>
        </div>

        {/* DataTable */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-center">Data Table</h2>
          <Card glass className="border border-white/20 shadow-xl">
            <CardContent className="pt-6">
              <DataTable
                data={tableData}
                columns={tableColumns}
                searchable
                filterable
                selectable
                onSort={handleSort}
                sortColumn={sortColumn}
                sortDirection={sortDirection}
                pagination={{
                  pageSize: 10,
                  currentPage: currentPage,
                  total: tableData.length,
                  onPageChange: setCurrentPage,
                }}
              />
            </CardContent>
          </Card>
        </div>

        {/* Form */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-center">Formulário Avançado</h2>
          <Card glass className="border border-white/20 shadow-xl">
            <CardContent className="pt-6">
              <Form
                fields={formFields}
                onSubmit={handleFormSubmit}
                submitText="Enviar Formulário"
                layout="grid"
              />
            </CardContent>
          </Card>
        </div>

        {/* Dropdown */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-center">Dropdown</h2>
          <div className="flex flex-wrap justify-center gap-4">
            <Dropdown
              trigger={
                <Button variant="outline" className="glass-effect border-white/20">
                  Menu Principal
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              }
              items={dropdownItems}
            />
            <Dropdown
              trigger={
                <Button variant="outline" className="glass-effect border-white/20">
                  Ações
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              }
              items={dropdownItems}
              align="end"
            />
          </div>
        </div>

        {/* Accordion */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-center">Accordion</h2>
          <Card glass className="border border-white/20 shadow-xl">
            <CardContent className="pt-6">
              <Accordion
                items={accordionItems}
                type="multiple"
                defaultOpen={["1"]}
              />
            </CardContent>
          </Card>
        </div>

        {/* Breadcrumb */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-center">Breadcrumb</h2>
          <Card glass className="border border-white/20 shadow-xl">
            <CardContent className="pt-6">
              <Breadcrumb items={breadcrumbItems} />
            </CardContent>
          </Card>
        </div>

        {/* Notification */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-center">Notifications</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Notification
              type="success"
              title="Operação Concluída"
              message="Sua transação foi processada com sucesso."
              actions={[
                { label: "Ver Detalhes", onClick: () => toast.info("Detalhes") },
                { label: "Fechar", onClick: () => toast.info("Fechado"), variant: "ghost" }
              ]}
              duration={8000}
              onClose={() => toast.info("Notificação fechada")}
            />
            <Notification
              type="error"
              title="Erro de Conexão"
              message="Não foi possível conectar ao servidor. Tente novamente."
              actions={[
                { label: "Tentar Novamente", onClick: () => toast.info("Tentando...") }
              ]}
              duration={0}
              onClose={() => toast.info("Notificação fechada")}
            />
            <Notification
              type="warning"
              title="Atenção"
              message="Você tem transações pendentes de revisão."
              duration={5000}
              onClose={() => toast.info("Notificação fechada")}
            />
            <Notification
              type="info"
              title="Nova Funcionalidade"
              message="Explore os novos recursos disponíveis."
              actions={[
                { label: "Explorar", onClick: () => toast.info("Explorando...") }
              ]}
              duration={6000}
              onClose={() => toast.info("Notificação fechada")}
            />
          </div>
        </div>

        {/* Toast */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-center">Toast Customizado</h2>
          <Card glass className="border border-white/20 shadow-xl">
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button
                  variant="outline"
                  onClick={() => toast.success("Sucesso!", "Operação realizada com sucesso!", 3000)}
                  className="flex flex-col items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Sucesso</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => toast.error("Erro!", "Algo deu errado. Tente novamente.", 4000)}
                  className="flex flex-col items-center gap-2"
                >
                  <XCircle className="w-4 h-4 text-red-500" />
                  <span>Erro</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => toast.warning("Atenção!", "Verifique os dados antes de continuar.", 3500)}
                  className="flex flex-col items-center gap-2"
                >
                  <AlertCircle className="w-4 h-4 text-yellow-500" />
                  <span>Atenção</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => toast.info("Informação", "Nova funcionalidade disponível!", 2500)}
                  className="flex flex-col items-center gap-2"
                >
                  <Info className="w-4 h-4 text-blue-500" />
                  <span>Info</span>
                </Button>
              </div>
              <div className="mt-4 text-center">
                <Button
                  variant="secondary"
                  onClick={() => toast.clearAll()}
                  className="text-sm"
                >
                  Limpar Todos os Toasts
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Modal */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-center">Modal</h2>
          <div className="flex justify-center">
            <Button onClick={() => setModalOpen(true)}>
              Abrir Modal
            </Button>
          </div>
          <Modal
            open={modalOpen}
            onClose={() => setModalOpen(false)}
            title="Modal de Exemplo"
            size="lg"
          >
            <div className="space-y-4">
              <p className="text-muted-foreground">
                Este é um exemplo de modal com glassmorphism e animações suaves.
              </p>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setModalOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={() => setModalOpen(false)}>
                  Confirmar
                </Button>
              </div>
            </div>
          </Modal>
        </div>

        {/* Componentes Originais */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-center">Componentes Base</h2>
          
          {/* Card Glassmorphism Avançado */}
          <Card glass className="border border-white/20 shadow-xl backdrop-blur-lg bg-gradient-to-br from-white/60 via-background/80 to-primary/10 animate-fade-in-up">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="flex flex-col gap-1">
                <span className="inline-block px-2 py-0.5 rounded bg-primary/10 text-primary text-xs font-bold tracking-wide mb-1">Glassmorphism</span>
                <CardTitle className="text-2xl font-extrabold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Visual Sofisticado
                </CardTitle>
              </div>
              <BarChart className="h-6 w-6 text-primary" />
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-2">
                Card com efeito vidro fosco, gradiente e sombra suave. Ideal para dashboards modernos.
              </p>
              <Button variant="outline" size="sm" className="mt-2">Ver código</Button>
            </CardContent>
          </Card>

          {/* Skeleton Loader Avançado */}
          <Card glass className="border border-primary/20 shadow-md animate-fade-in-up">
            <CardHeader>
              <CardTitle className="text-lg font-bold">Skeleton Loader</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-1/3" />
                </div>
              </div>
              <Skeleton className="h-8 w-full rounded-lg" />
              <div className="flex gap-2">
                <Skeleton className="h-10 w-24 rounded-md" />
                <Skeleton className="h-10 w-24 rounded-md" />
              </div>
              <div className="flex gap-4">
                <Button onClick={handleSimulateLoading} disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Simular Loading
                </Button>
                <Button variant="secondary" onClick={handleShowToast}>
                  Mostrar Toast Animado
                </Button>
              </div>
              {loading && (
                <div className="space-y-2 mt-4">
                  <Skeleton className="h-6 w-1/2" />
                  <Skeleton className="h-6 w-1/3" />
                  <Skeleton className="h-10 w-full rounded-lg" />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Gradiente Animado */}
          <div className="rounded-2xl overflow-hidden shadow-lg animate-fade-in-up">
            <div className="relative h-32 w-full animate-gradient-move bg-gradient-to-r from-primary via-accent to-blue-400">
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-white text-lg font-bold drop-shadow-lg">Gradiente Animado</span>
                <span className="text-white/80 text-xs mt-1">Fundo com animação sutil para destaque visual</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Animações utilitárias */}
      <style jsx global>{`
        @keyframes fade-in-up {
          0% { opacity: 0; transform: translateY(24px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up { animation: fade-in-up 0.7s cubic-bezier(.4,0,.2,1) both; }
        .animate-fade-in { animation: fade-in 0.5s cubic-bezier(.4,0,.2,1) both; }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes gradient-move {
          0% { background-position: 0% 50%; }
          100% { background-position: 100% 50%; }
        }
        .animate-gradient-move {
          background-size: 200% 200%;
          animation: gradient-move 4s linear infinite alternate;
        }
        @keyframes draw {
          from { stroke-dasharray: 0 1000; }
          to { stroke-dasharray: 1000 0; }
        }
        .animate-draw {
          stroke-dasharray: 1000;
          stroke-dashoffset: 1000;
          animation: draw 2s ease-in-out forwards;
        }
        @keyframes grow {
          from { transform: scaleY(0); }
          to { transform: scaleY(1); }
        }
        .animate-grow {
          transform-origin: bottom;
          animation: grow 1s ease-out forwards;
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>

      {/* Toast Container */}
      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />
    </div>
  );
} 