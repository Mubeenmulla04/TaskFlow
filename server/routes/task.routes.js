import express from 'express';
import { createTask, getTasks, updateTask, deleteTask, getDashboardStats } from '../controllers/task.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(protect);

router.get('/stats', getDashboardStats);
router.route('/').post(createTask).get(getTasks);
router.route('/:id').put(updateTask).delete(deleteTask);

export default router;
