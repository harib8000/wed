import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { searchService } from '../services/search.service';
import { requireInternalOrAdmin } from '../middleware/auth.middleware';

const router = Router();

const SearchQuerySchema = z.object({
  query: z.string().optional(),
  category: z.string().optional(),
  city: z.string().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  minRating: z.coerce.number().min(0).max(5).optional(),
  sortBy: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  featured: z.enum(['true', 'false']).optional().transform(v => v === 'true' ? true : v === 'false' ? false : undefined),
});

// GET /search/vendors?query=&category=&city=&minPrice=&maxPrice=&minRating=&sortBy=&page=&limit=
router.get('/vendors', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = SearchQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: { code: 'VAL_2001', message: 'Invalid query parameters', details: parsed.error.flatten() },
      });
      return;
    }
    const result = await searchService.searchVendors(parsed.data);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

// GET /search/autocomplete?q=
router.get('/autocomplete', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const q = (req.query.q as string) || '';
    const suggestions = await searchService.autocomplete(q);
    res.json({ success: true, data: { suggestions } });
  } catch (err) {
    next(err);
  }
});

// POST /search/vendors/index — internal endpoint to index a vendor
router.post('/vendors/index', requireInternalOrAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await searchService.indexVendor(req.body);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export { router as searchRouter };
