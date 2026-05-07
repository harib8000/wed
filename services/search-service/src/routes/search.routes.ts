import { Router, Request, Response } from 'express';
import { searchService } from '../services/search.service';

const router = Router();

// GET /search/vendors?query=&category=&city=&minPrice=&maxPrice=&minRating=&sortBy=&page=&limit=
router.get('/vendors', async (req: Request, res: Response) => {
  try {
    const { query, category, city, minPrice, maxPrice, minRating, sortBy, page, limit, featured } = req.query as any;
    const result = await searchService.searchVendors({
      query, category, city,
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
      minRating: minRating ? parseFloat(minRating) : undefined,
      sortBy,
      page: page ? parseInt(page) : 1,
      limit: limit ? Math.min(parseInt(limit), 50) : 20,
      featured: featured === 'true' ? true : featured === 'false' ? false : undefined,
    });
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// GET /search/autocomplete?q=
router.get('/autocomplete', async (req: Request, res: Response) => {
  try {
    const q = (req.query.q as string) || '';
    const suggestions = await searchService.autocomplete(q);
    res.json({ success: true, data: { suggestions } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// POST /search/vendors/index — internal endpoint to index a vendor
router.post('/vendors/index', async (req: Request, res: Response) => {
  try {
    await searchService.indexVendor(req.body);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

export { router as searchRouter };
