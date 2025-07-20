"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { 
  Activity, 
  AlertTriangle, 
  BarChart3, 
  Download, 
  Eye, 
  FileText, 
  HardDrive, 
  Mail, 
  Shield, 
  Users,
  Zap,
  RefreshCw,
  Trash2,
  Settings
} from "lucide-react";

interface DashboardData {
  emailMetrics: {
    sentToday: number;
    failedToday: number;
    successRate: number;
    queueSize: number;
  };
  authMetrics: {
    loginAttempts: number;
    failedLogins: number;
    activeUsers: number;
    tokenRefreshes: number;
  };
  systemMetrics: {
    memoryUsage: number;
    cpuUsage: number;
    diskUsage: number;
    uptime: number;
    databaseConnections: number;
  };
  recentLogs: Array<{
    id: number;
    timestamp: string;
    level: string;
    category: string;
    message: string;
    userId?: number;
    hubId?: number;
  }>;
  errorCount: number;
  timestamp: string;
}

interface SystemStatus {
  overall: string;
  email: string;
  auth: string;
  database: string;
  metrics: DashboardData;
  recentErrors: Array<any>;
  timestamp: string;
}

export default function GodModePage() {
  const { toast } = useToast();
  const { usuario } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Verificar se o usuário tem privilégios de Deus
  useEffect(() => {
    if (usuario && !usuario.is_god) {
      toast({
        title: "Acesso Negado",
        description: "Você não tem privilégios para acessar o Modo Deus.",
        variant: "destructive",
      });
      // Redirecionar para dashboard
      window.location.href = '/dashboard';
    }
  }, [usuario, toast]);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/god/dashboard', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) throw new Error('Erro ao carregar dashboard');
      
      const data = await response.json();
      setDashboardData(data.data);
    } catch (error) {
      toast({
        title: "Erro ao carregar dashboard",
        description: "Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const fetchSystemStatus = async () => {
    try {
      const response = await fetch('/api/god/status', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) throw new Error('Erro ao carregar status');
      
      const data = await response.json();
      setSystemStatus(data.data);
    } catch (error) {
      toast({
        title: "Erro ao carregar status",
        description: "Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const fetchLogs = async () => {
    try {
      const response = await fetch('/api/god/logs?limit=50', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) throw new Error('Erro ao carregar logs');
      
      const data = await response.json();
      setLogs(data.data);
    } catch (error) {
      toast({
        title: "Erro ao carregar logs",
        description: "Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const fetchMetrics = async () => {
    try {
      const response = await fetch('/api/god/metrics?limit=50', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) throw new Error('Erro ao carregar métricas');
      
      const data = await response.json();
      setMetrics(data.data);
    } catch (error) {
      toast({
        title: "Erro ao carregar métricas",
        description: "Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        fetchDashboardData(),
        fetchSystemStatus(),
        fetchLogs(),
        fetchMetrics()
      ]);
      toast({ title: "Dados atualizados com sucesso!" });
    } catch (error) {
      toast({
        title: "Erro ao atualizar dados",
        description: "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  };

  const handleExport = async (type: 'logs' | 'metrics', format: 'json' | 'csv') => {
    try {
      const response = await fetch(`/api/god/export/${type}?format=${format}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) throw new Error('Erro ao exportar dados');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}_${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({ title: `Exportação de ${type} realizada com sucesso!` });
    } catch (error) {
      toast({
        title: "Erro ao exportar dados",
        description: "Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleMaintenance = async (action: string) => {
    try {
      const response = await fetch('/api/god/maintenance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ action })
      });
      
      if (!response.ok) throw new Error('Erro na manutenção');
      
      const data = await response.json();
      toast({ title: data.message });
      
      // Recarregar dados após manutenção
      await handleRefresh();
    } catch (error) {
      toast({
        title: "Erro na manutenção",
        description: "Tente novamente.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (usuario?.is_god) {
      const loadData = async () => {
        setLoading(true);
        try {
          await Promise.all([
            fetchDashboardData(),
            fetchSystemStatus(),
            fetchLogs(),
            fetchMetrics()
          ]);
        } finally {
          setLoading(false);
        }
      };
      
      loadData();
    }
  }, [usuario]);

  if (!usuario?.is_god) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <Shield className="h-12 w-12 mx-auto mb-4 text-red-500" />
            <h2 className="text-xl font-semibold mb-2">Acesso Negado</h2>
            <p className="text-gray-600">Você não tem privilégios para acessar o Modo Deus.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando Modo Deus...</p>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-100 text-green-700 border-green-200';
      case 'warning': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'error': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'healthy': return 'Saudável';
      case 'warning': return 'Atenção';
      case 'error': return 'Erro';
      default: return 'Desconhecido';
    }
  };

  const getLogLevelColor = (level: string) => {
    switch (level) {
      case 'ERROR': return 'bg-red-100 text-red-700 border-red-200';
      case 'WARN': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'INFO': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'DEBUG': return 'bg-gray-100 text-gray-600 border-gray-200';
      default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Modo Deus</h1>
          <p className="text-gray-600 mt-2">Monitoramento completo do sistema</p>
        </div>
        <Button onClick={handleRefresh} disabled={refreshing} className="flex items-center space-x-2">
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          <span>Atualizar</span>
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="status">Status</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
          <TabsTrigger value="metrics">Métricas</TabsTrigger>
          <TabsTrigger value="maintenance">Manutenção</TabsTrigger>
        </TabsList>

        {/* Dashboard */}
        <TabsContent value="dashboard" className="space-y-6">
          {dashboardData && (
            <>
              {/* Métricas Principais */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Emails Hoje</CardTitle>
                    <Mail className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{dashboardData.emailMetrics.sentToday}</div>
                    <p className="text-xs text-muted-foreground">
                      {dashboardData.emailMetrics.failedToday} falharam
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Logins</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{dashboardData.authMetrics.loginAttempts}</div>
                    <p className="text-xs text-muted-foreground">
                      {dashboardData.authMetrics.failedLogins} falharam
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Memória</CardTitle>
                    <HardDrive className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{dashboardData.systemMetrics.memoryUsage}MB</div>
                    <p className="text-xs text-muted-foreground">
                      Uso atual do sistema
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Erros (24h)</CardTitle>
                    <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{dashboardData.errorCount}</div>
                    <p className="text-xs text-muted-foreground">
                      Últimas 24 horas
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Logs Recentes */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <FileText className="h-5 w-5" />
                    <span>Logs Recentes</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {dashboardData.recentLogs.slice(0, 10).map((log) => (
                      <div key={log.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Badge className={getLogLevelColor(log.level)}>
                            {log.level}
                          </Badge>
                          <div>
                            <p className="text-sm font-medium">{log.message}</p>
                            <p className="text-xs text-gray-500">
                              {log.category} • {new Date(log.timestamp).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-xs text-gray-400">
                          {log.userId && `User: ${log.userId}`}
                          {log.hubId && ` • Hub: ${log.hubId}`}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Status do Sistema */}
        <TabsContent value="status" className="space-y-6">
          {systemStatus && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Activity className="h-5 w-5" />
                    <span>Status Geral</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge className={getStatusColor(systemStatus.overall)}>
                    {getStatusLabel(systemStatus.overall)}
                  </Badge>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Mail className="h-5 w-5" />
                    <span>Email</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge className={getStatusColor(systemStatus.email)}>
                    {getStatusLabel(systemStatus.email)}
                  </Badge>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Shield className="h-5 w-5" />
                    <span>Autenticação</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge className={getStatusColor(systemStatus.auth)}>
                    {getStatusLabel(systemStatus.auth)}
                  </Badge>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <HardDrive className="h-5 w-5" />
                    <span>Banco de Dados</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge className={getStatusColor(systemStatus.database)}>
                    {getStatusLabel(systemStatus.database)}
                  </Badge>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Logs */}
        <TabsContent value="logs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FileText className="h-5 w-5" />
                  <span>Logs do Sistema</span>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExport('logs', 'json')}
                    className="flex items-center space-x-2"
                  >
                    <Download className="h-4 w-4" />
                    <span>JSON</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExport('logs', 'csv')}
                    className="flex items-center space-x-2"
                  >
                    <Download className="h-4 w-4" />
                    <span>CSV</span>
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {logs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Badge className={getLogLevelColor(log.level)}>
                        {log.level}
                      </Badge>
                      <div>
                        <p className="text-sm font-medium">{log.message}</p>
                        <p className="text-xs text-gray-500">
                          {log.category} • {new Date(log.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-xs text-gray-400">
                      {log.userId && `User: ${log.userId}`}
                      {log.hubId && ` • Hub: ${log.hubId}`}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Métricas */}
        <TabsContent value="metrics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5" />
                  <span>Métricas do Sistema</span>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExport('metrics', 'json')}
                    className="flex items-center space-x-2"
                  >
                    <Download className="h-4 w-4" />
                    <span>JSON</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExport('metrics', 'csv')}
                    className="flex items-center space-x-2"
                  >
                    <Download className="h-4 w-4" />
                    <span>CSV</span>
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {metrics.map((metric) => (
                  <div key={metric.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Zap className="h-4 w-4 text-blue-500" />
                      <div>
                        <p className="text-sm font-medium">{metric.metricName}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(metric.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-sm font-bold">
                      {metric.metricValue}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Manutenção */}
        <TabsContent value="maintenance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>Manutenção do Sistema</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button
                  variant="outline"
                  onClick={() => handleMaintenance('cleanup_logs')}
                  className="flex items-center space-x-2"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Limpar Logs Antigos</span>
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => handleMaintenance('cleanup_metrics')}
                  className="flex items-center space-x-2"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Limpar Métricas Antigas</span>
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => handleMaintenance('reset_daily_metrics')}
                  className="flex items-center space-x-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>Resetar Métricas Diárias</span>
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => handleMaintenance('update_system_metrics')}
                  className="flex items-center space-x-2"
                >
                  <Activity className="h-4 w-4" />
                  <span>Atualizar Métricas do Sistema</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 