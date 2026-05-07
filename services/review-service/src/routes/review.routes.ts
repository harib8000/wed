import { Router } from 'express';
import { reviewController } from '../controllers/review.controller';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

// POST /reviews — customer submits review after booking
router.post('/', authenticate, requireRole('customer'), reviewController.createReview);

// GET /reviews/me — customer gets their own reviews
router.get('/me', authenticate, requireRole('customer'), reviewController.getMyReviews);

// GET /reviews/vendor/:vendorId — public vendor reviews
router.get('/vendor/:vendorId', reviewController.getVendorReviews);

// POST /reviews/:reviewId/reply — vendor replies
router.post('/:reviewId/reply', authenticate, requireRole('vendor'), reviewController.replyToReview);

// POST /reviews/:reviewId/helpful — mark helpful
router.post('/:reviewId/helpful', authenticate, reviewController.markHelpful);

export { router as reviewRouter };
