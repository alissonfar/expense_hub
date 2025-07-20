import { Router } from 'express';
import { requireGodMode } from '../middleware/godMode';
import GodController from '../controllers/godController';

const router = Router();

// Todas as rotas requerem Modo Deus
router.use(requireGodMode);

// Dashboard principal
router.get('/dashboard', (req, res) => {
  const controller = new GodController(req);
  controller.getDashboard(req, res);
});

// Logs
router.get('/logs', (req, res) => {
  const controller = new GodController(req);
  controller.getLogs(req, res);
});

// Métricas
router.get('/metrics', (req, res) => {
  const controller = new GodController(req);
  controller.getMetrics(req, res);
});

// Status do sistema
router.get('/status', (req, res) => {
  const controller = new GodController(req);
  controller.getSystemStatus(req, res);
});

// Exportação
router.get('/export/logs', (req, res) => {
  const controller = new GodController(req);
  controller.exportLogs(req, res);
});

router.get('/export/metrics', (req, res) => {
  const controller = new GodController(req);
  controller.exportMetrics(req, res);
});

// Manutenção
router.post('/maintenance', (req, res) => {
  const controller = new GodController(req);
  controller.maintenance(req, res);
});

// Configurações do Modo Deus
router.get('/config', (req, res) => {
  res.json({
    success: true,
    data: {
      features: ['dashboard', 'logs', 'metrics', 'export', 'maintenance'],
      retention: {
        logs: '90 days',
        metrics: '30 days'
      },
      limits: {
        exportMaxRecords: 10000,
        dashboardRefreshInterval: 30000
      }
    }
  });
});

// Rota de teste para verificar se o Modo Deus está funcionando
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Modo Deus funcionando corretamente!',
    user: {
      id: req.auth?.pessoaId,
      isGod: true
    },
    timestamp: new Date().toISOString()
  });
});

export default router; 