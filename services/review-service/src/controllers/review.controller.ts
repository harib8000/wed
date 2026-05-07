import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { reviewService } from '../services/review.service';

export const reviewController = {
  async createReview(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const customerId = req.user!.id;
      const review = await reviewService.createReview(customerId, req.body);
      res.status(201).json({ success: true, data: { review } });
    } catch (err) { next(err); }
  },

  async getVendorReviews(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { vendorId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
      const data = await reviewService.getVendorReviews(vendorId, page, limit);
      res.json({ success: true, data });
    } catch (err) { next(err); }
  },

  async replyToReview(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const vendorId = req.user!.id;
      const { reviewId } = req.params;
      const { reply } = req.body;
      const review = await reviewService.replyToReview(vendorId, reviewId, reply);
      res.json({ success: true, data: { review } });
    } catch (err) { next(err); }
  },

  async markHelpful(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { reviewId } = req.params;
      const review = await reviewService.markHelpful(reviewId);
      res.json({ success: true, data: { review } });
    } catch (err) { next(err); }
  },

  async getMyReviews(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const customerId = req.user!.id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
      const data = await reviewService.getMyReviews(customerId, page, limit);
      res.json({ success: true, data });
    } catch (err) { next(err); }
  },
};
