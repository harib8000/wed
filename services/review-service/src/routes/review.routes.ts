import { Router } from 'express';
import { z } from 'zod';
import { reviewController } from '../controllers/review.controller';
import { authenticate, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { prisma } from '../config/database';

// ── Zod Schemas ─────────────────────────────────────────────────────────────

export const CreateReviewSchema = z.object({
  bookingId: z.string().uuid(),
  vendorId: z.string().uuid(),
  rating: z.number().min(1).max(5),
  body: z.string().min(10).max(2000),
  title: z.string().max(200).optional(),
  qualityRating: z.number().min(1).max(5).optional(),
  valueRating: z.number().min(1).max(5).optional(),
  professionalismRating: z.number().min(1).max(5).optional(),
  punctualityRating: z.number().min(1).max(5).optional(),
});

export const ReplySchema = z.object({
  reply: z.string().min(1).max(1000),
});

export const PaginationQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(20),
});

// ── Routes ──────────────────────────────────────────────────────────────────

const router = Router();

// POST /reviews — customer submits review after booking
router.post('/', authenticate, requireRole('customer'), validate(CreateReviewSchema), reviewController.createReview);

// GET /reviews/me — customer gets their own reviews
router.get('/me', authenticate, requireRole('customer'), validate(PaginationQuerySchema, 'query'), reviewController.getMyReviews);

// GET /reviews/vendor/:vendorId — public vendor reviews
router.get('/vendor/:vendorId', validate(PaginationQuerySchema, 'query'), reviewController.getVendorReviews);

// POST /reviews/:reviewId/reply — vendor replies
router.post('/:reviewId/reply', authenticate, requireRole('vendor'), validate(ReplySchema), reviewController.replyToReview);

// POST /reviews/:reviewId/helpful — mark helpful
router.post('/:reviewId/helpful', authenticate, reviewController.markHelpful);

// GET /reviews/admin/stats — aggregate rating stats (admin only)
router.get('/admin/stats', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    const result = await prisma.review.aggregate({
      where: { isPublished: true },
      _avg: { rating: true },
      _count: { id: true },
    });
    res.json({
      success: true,
      data: {
        avgRating: result._avg.rating != null ? Math.round(result._avg.rating * 100) / 100 : 0,
        totalReviews: result._count.id,
      },
    });
  } catch (err) { next(err); }
});

export { router as reviewRouter };
