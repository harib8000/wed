import { prisma } from '../config/database';
import axios from 'axios';
import { config } from '../config';
import { getEventBus, type DomainEventType } from '@wedding-os/shared-events';
import { logger } from '../utils/logger';
import { NotFoundError, ConflictError } from '@wedding-os/shared-errors';
import type { VendorProfile } from '@wedding-os/shared-types';

function publishEvent(type: DomainEventType, aggregateId: string, payload: Record<string, unknown>) {
  try {
    const bus = getEventBus();
    bus.publish(type, aggregateId, 'review', payload).catch((err: unknown) =>
      logger.warn({ err, type }, 'Event publish failed (non-blocking)')
    );
  } catch {
    logger.warn('Event bus not initialized (e.g., in tests) — skipping publish');
  }
}

async function recalcVendorRating(vendorId: string) {
  const stats = await prisma.review.aggregate({
    where: { vendorId, isPublished: true },
    _avg: { rating: true },
    _count: { rating: true },
  });
  // Notify vendor-service to update denormalized stats
  axios.patch(`${config.VENDOR_SERVICE_URL}/vendors/${vendorId}/rating-stats`, {
    avgRating: stats._avg.rating ?? 0,
    reviewCount: stats._count.rating,
  }).catch(() => {
    logger.warn({ vendorId }, 'Failed to update vendor rating stats (non-fatal)');
  });
}

export const reviewService = {
  async createReview(customerId: string, data: {
    bookingId: string;
    vendorId: string;
    rating: number;
    body: string;
    title?: string;
    qualityRating?: number;
    valueRating?: number;
    professionalismRating?: number;
    punctualityRating?: number;
  }) {
    const existing = await prisma.review.findUnique({ where: { bookingId: data.bookingId } });
    if (existing) throw new ConflictError('Review already submitted for this booking');

    const review = await prisma.review.create({
      data: {
        ...data,
        customerId,
        isPublished: true, // auto-publish; can add moderation flow
      },
    });

    await recalcVendorRating(data.vendorId);
    publishEvent('review.created', review.id, {
      reviewId: review.id,
      customerId,
      vendorId: data.vendorId,
      bookingId: data.bookingId,
      rating: data.rating,
    });
    return review;
  },

  async getVendorReviews(vendorId: string, page = 1, limit = 20) {
    const whereClause = { vendorId, isPublished: true };
    const [reviews, total, stats] = await Promise.all([
      prisma.review.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: { id: true, rating: true, title: true, body: true, qualityRating: true, valueRating: true, professionalismRating: true, punctualityRating: true, photos: true, vendorReply: true, vendorRepliedAt: true, helpfulCount: true, createdAt: true },
      }),
      prisma.review.count({ where: whereClause }),
      prisma.review.aggregate({ where: whereClause, _avg: { rating: true, qualityRating: true, valueRating: true, professionalismRating: true, punctualityRating: true }, _count: { id: true } }),
    ]);

    return { reviews, total, page, limit, totalPages: Math.ceil(total / limit), stats };
  },

  async replyToReview(vendorId: string, reviewId: string, reply: string) {
    const review = await prisma.review.findFirst({ where: { id: reviewId, vendorId } });
    if (!review) throw new NotFoundError('Review', reviewId);
    return prisma.review.update({ where: { id: reviewId }, data: { vendorReply: reply, vendorRepliedAt: new Date() } });
  },

  async markHelpful(reviewId: string) {
    return prisma.review.update({ where: { id: reviewId }, data: { helpfulCount: { increment: 1 } } });
  },

  async getMyReviews(customerId: string, page = 1, limit = 20) {
    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: { customerId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.review.count({ where: { customerId } }),
    ]);
    return { reviews, total, page, limit, totalPages: Math.ceil(total / limit) };
  },
};
