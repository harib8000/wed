import { prisma } from '../config/database';
import axios from 'axios';
import { config } from '../config';

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
  }).catch(() => { /* non-fatal */ });
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
    if (existing) throw Object.assign(new Error('Review already submitted for this booking'), { statusCode: 409, code: 'RES_3002' });

    const review = await prisma.review.create({
      data: {
        ...data,
        customerId,
        isPublished: true, // auto-publish; can add moderation flow
      },
    });

    await recalcVendorRating(data.vendorId);
    return review;
  },

  async getVendorReviews(vendorId: string, page = 1, limit = 20) {
    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: { vendorId, isPublished: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: { id: true, rating: true, title: true, body: true, qualityRating: true, valueRating: true, professionalismRating: true, punctualityRating: true, photos: true, vendorReply: true, vendorRepliedAt: true, helpfulCount: true, createdAt: true, customerId: true },
      }),
      prisma.review.count({ where: { vendorId, isPublished: true } }),
    ]);

    const stats = await prisma.review.aggregate({ where: { vendorId, isPublished: true }, _avg: { rating: true, qualityRating: true, valueRating: true, professionalismRating: true, punctualityRating: true }, _count: { id: true } });

    return { reviews, total, page, limit, totalPages: Math.ceil(total / limit), stats };
  },

  async replyToReview(vendorId: string, reviewId: string, reply: string) {
    const review = await prisma.review.findFirst({ where: { id: reviewId, vendorId } });
    if (!review) throw Object.assign(new Error('Review not found'), { statusCode: 404, code: 'RES_3001' });
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
