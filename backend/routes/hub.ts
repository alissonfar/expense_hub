import { Router } from 'express';
import { createHub } from '../controllers/hubController';
import { requireAuth } from '../middleware/auth';

const router = Router();

// Criar novo hub (autenticado)
router.post('/', createHub);

export default router; 