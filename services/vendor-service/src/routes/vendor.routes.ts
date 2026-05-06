import { Router, Request, Response, NextFunction } from 'express';
import { vendorService } from '../services/vendor.service';
import { searchService } from '../services/search.service';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate';
import { getPresignedUploadUrl } from '../utils/s3';
import { z } from 'zod';

export const vendorRouter = Router();
const meta = (req: Request) => ({ requestId: req.headers['x-request-id'], timestamp: new Date().toISOString() });

// ── Schemas ───────────────────────────────────────────────────────────────────

const CreateVendorSchema = z.object({
  businessName: z.string().min(2).max(200),
  category: z.string(),
  city: z.string().max(100),
  state: z.string().max(100),
  pincode: z.string().regex(/^\d{6}$/),
});

const UpdateVendorSchema = z.object({
  businessName: z.string().max(200).optional(),
  tagline: z.string().max(300).optional(),
  description: z.string().max(5000).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  pincode: z.string().regex(/^\d{6}$/).optional(),
  serviceCities: z.array(z.string()).optional(),
  yearsExperience: z.number().int().min(0).max(100).optional(),
  teamSize: z.number().int().min(1).max(10000).optional(),
  whatsappNumber: z.string().optional(),
  websiteUrl: z.string().url().optional(),
  instagramUrl: z.string().url().optional(),
  gstNumber: z.string().optional(),
  panNumber: z.string().optional(),
  bankAccountNo: z.string().optional(),
  bankIfsc: z.string().optional(),
  bankAccountName: z.string().optional(),
});

const UpsertPackageSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(2).max(200),
  packageType: z.enum(['BASIC', 'STANDARD', 'PREMIUM', 'CUSTOM']),
  priceFromPaise: z.number().int().min(0),
  priceUpToPaise: z.number().int().optional(),
  isCustomQuote: z.boolean().optional(),
  description: z.string().max(2000).optional(),
  inclusions: z.array(z.string()).optional(),
  exclusions: z.array(z.string()).optional(),
  deliverables: z.array(z.string()).optional(),
});

const SearchQuerySchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  city: z.string().optional(),
  minRating: z.coerce.number().optional(),
  minPricePaise: z.coerce.number().optional(),
  maxPricePaise: z.coerce.number().optional(),
  plusMembersOnly: z.string().transform((v) => v === 'true').optional(),
  page: z.coerce.number().default(1),
  limit: z.coerce.number().max(50).default(20),
  sortBy: z.enum(['rating', 'price_asc', 'price_desc', 'bookings', 'relevance']).optional(),
});

// ── Public routes ─────────────────────────────────────────────────────────────

vendorRouter.get('/search', validate(SearchQuerySchema, 'query'), async (req, res, next) => {
  try {
    const result = await searchService.search(req.query as any);
    res.json({ success: true, data: result, meta: meta(req) });
  } catch (err) { next(err); }
});

vendorRouter.get('/suggest', async (req, res, next) => {
  try {
    const { q = '', city } = req.query as any;
    const results = await searchService.suggest(q, city);
    res.json({ success: true, data: { suggestions: results }, meta: meta(req) });
  } catch (err) { next(err); }
});

vendorRouter.get('/:slug', async (req, res, next) => {
  try {
    const vendor = await vendorService.getBySlug(req.params.slug);
    if (!vendor || vendor.status !== 'ACTIVE') {
      return res.status(404).json({ success: false, error: { code: 'RES_3001', message: 'Vendor not found' }, meta: meta(req) });
    }
    res.json({ success: true, data: { vendor }, meta: meta(req) });
  } catch (err) { next(err); }
});

// ── Authenticated vendor routes ───────────────────────────────────────────────

vendorRouter.post(
  '/',
  authenticate,
  requireRole('vendor', 'admin'),
  validate(CreateVendorSchema),
  async (req, res, next) => {
    try {
      const vendor = await vendorService.create(req.user!.id, req.body);
      res.status(201).json({ success: true, data: { vendor }, meta: meta(req) });
    } catch (err) { next(err); }
  }
);

vendorRouter.get('/me/profile', authenticate, requireRole('vendor', 'admin'), async (req, res, next) => {
  try {
    const vendor = await vendorService.getByUserId(req.user!.id);
    if (!vendor) return res.status(404).json({ success: false, error: { code: 'RES_3001', message: 'Vendor profile not found' }, meta: meta(req) });
    res.json({ success: true, data: { vendor }, meta: meta(req) });
  } catch (err) { next(err); }
});

vendorRouter.put('/me/profile', authenticate, requireRole('vendor', 'admin'), validate(UpdateVendorSchema), async (req, res, next) => {
  try {
    const existing = await vendorService.getByUserId(req.user!.id);
    if (!existing) return res.status(404).json({ success: false, error: { code: 'RES_3001', message: 'Vendor not found' }, meta: meta(req) });
    const vendor = await vendorService.update(existing.id, req.body);
    res.json({ success: true, data: { vendor }, meta: meta(req) });
  } catch (err) { next(err); }
});

vendorRouter.post('/me/packages', authenticate, requireRole('vendor', 'admin'), validate(UpsertPackageSchema), async (req, res, next) => {
  try {
    const existing = await vendorService.getByUserId(req.user!.id);
    if (!existing) return res.status(404).json({ success: false, error: { code: 'RES_3001', message: 'Vendor not found' }, meta: meta(req) });
    const pkg = await vendorService.upsertPackage(existing.id, req.body);
    res.status(201).json({ success: true, data: { package: pkg }, meta: meta(req) });
  } catch (err) { next(err); }
});

vendorRouter.delete('/me/packages/:packageId', authenticate, requireRole('vendor', 'admin'), async (req, res, next) => {
  try {
    const existing = await vendorService.getByUserId(req.user!.id);
    if (!existing) return res.status(404).json({ success: false, error: { code: 'RES_3001', message: 'Vendor not found' }, meta: meta(req) });
    await vendorService.deletePackage(existing.id, req.params.packageId);
    res.json({ success: true, data: { message: 'Package deleted' }, meta: meta(req) });
  } catch (err) { next(err); }
});

vendorRouter.post('/me/portfolio/presign', authenticate, requireRole('vendor', 'admin'), async (req, res, next) => {
  try {
    const { contentType = 'image/jpeg' } = req.body;
    const ext = contentType.split('/')[1] || 'jpg';
    const existing = await vendorService.getByUserId(req.user!.id);
    if (!existing) return res.status(404).json({ success: false, error: { code: 'RES_3001', message: 'Vendor not found' }, meta: meta(req) });
    const result = await getPresignedUploadUrl(`portfolio/${existing.id}`, contentType, ext);

    // Only add to DB after upload confirmed — client calls confirm endpoint
    res.json({ success: true, data: { ...result, vendorId: existing.id }, meta: meta(req) });
  } catch (err) { next(err); }
});

vendorRouter.post('/me/portfolio/confirm', authenticate, requireRole('vendor', 'admin'), async (req, res, next) => {
  try {
    const { s3Key, publicUrl, caption, mediaType } = req.body;
    const existing = await vendorService.getByUserId(req.user!.id);
    if (!existing) return res.status(404).json({ success: false, error: { code: 'RES_3001', message: 'Vendor not found' }, meta: meta(req) });
    const item = await vendorService.addPortfolioItem(existing.id, s3Key, publicUrl, caption, mediaType);
    res.status(201).json({ success: true, data: { item }, meta: meta(req) });
  } catch (err) { next(err); }
});

vendorRouter.post('/me/availability', authenticate, requireRole('vendor', 'admin'), async (req, res, next) => {
  try {
    const existing = await vendorService.getByUserId(req.user!.id);
    if (!existing) return res.status(404).json({ success: false, error: { code: 'RES_3001', message: 'Vendor not found' }, meta: meta(req) });
    await vendorService.setAvailability(existing.id, req.body.blockedDates ?? []);
    res.json({ success: true, data: { message: 'Availability updated' }, meta: meta(req) });
  } catch (err) { next(err); }
});

vendorRouter.post('/me/submit-review', authenticate, requireRole('vendor', 'admin'), async (req, res, next) => {
  try {
    const existing = await vendorService.getByUserId(req.user!.id);
    if (!existing) return res.status(404).json({ success: false, error: { code: 'RES_3001', message: 'Vendor not found' }, meta: meta(req) });
    const vendor = await vendorService.submitForReview(existing.id);
    res.json({ success: true, data: { vendor }, meta: meta(req) });
  } catch (err) { next(err); }
});

// ── Admin ─────────────────────────────────────────────────────────────────────

vendorRouter.patch('/:id/approve', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    const vendor = await vendorService.approveVendor(req.params.id);
    res.json({ success: true, data: { vendor }, meta: meta(req) });
  } catch (err) { next(err); }
});

vendorRouter.patch('/:id/suspend', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    const vendor = await vendorService.suspendVendor(req.params.id, req.body.note);
    res.json({ success: true, data: { vendor }, meta: meta(req) });
  } catch (err) { next(err); }
});

vendorRouter.get('/health', (_req, res) => res.json({ status: 'ok', service: 'vendor-service' }));
