import { Router, Request, Response, NextFunction } from 'express';
import { timelineService } from '../services/timeline.service';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate';
import { z } from 'zod';

export const executionRouter = Router();
const meta = (req: Request) => ({ requestId: req.headers['x-request-id'], timestamp: new Date().toISOString() });

const CreateTimelineSchema = z.object({ weddingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) });
const AddTaskSchema = z.object({
  title: z.string().min(2).max(300),
  category: z.string().optional(),
  description: z.string().max(2000).optional(),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  linkedBookingId: z.string().uuid().optional(),
  assignedVendorId: z.string().uuid().optional(),
});
const UpdateTaskSchema = z.object({
  status: z.enum(['PENDING', 'IN_PROGRESS', 'DONE', 'SKIPPED']).optional(),
  title: z.string().max(300).optional(),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  description: z.string().max(2000).optional(),
});

executionRouter.post('/timeline', authenticate, validate(CreateTimelineSchema), async (req, res, next) => {
  try {
    const tl = await timelineService.getOrCreate(req.user!.id, new Date(req.body.weddingDate));
    res.status(201).json({ success: true, data: { timeline: tl }, meta: meta(req) });
  } catch (err) { next(err); }
});

executionRouter.get('/timeline', authenticate, async (req, res, next) => {
  try {
    const tl = await timelineService.getTimeline(req.user!.id);
    if (!tl) return res.status(404).json({ success: false, error: { code: 'RES_3001', message: 'Timeline not found' }, meta: meta(req) });
    res.json({ success: true, data: { timeline: tl }, meta: meta(req) });
  } catch (err) { next(err); }
});

executionRouter.post('/timeline/tasks', authenticate, validate(AddTaskSchema), async (req, res, next) => {
  try {
    const task = await timelineService.addTask(req.user!.id, req.body);
    res.status(201).json({ success: true, data: { task }, meta: meta(req) });
  } catch (err) { next(err); }
});

executionRouter.patch('/timeline/tasks/:id', authenticate, validate(UpdateTaskSchema), async (req, res, next) => {
  try {
    const task = await timelineService.updateTask(req.user!.id, req.params.id, req.body);
    res.json({ success: true, data: { task }, meta: meta(req) });
  } catch (err) { next(err); }
});

executionRouter.delete('/timeline/tasks/:id', authenticate, async (req, res, next) => {
  try {
    await timelineService.deleteTask(req.user!.id, req.params.id);
    res.json({ success: true, data: { message: 'Task deleted' }, meta: meta(req) });
  } catch (err) { next(err); }
});

executionRouter.get('/health', (_req, res) => res.json({ status: 'ok', service: 'execution-service' }));
