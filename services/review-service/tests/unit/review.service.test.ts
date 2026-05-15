import { reviewService } from '../../src/services/review.service';

/* ── Mocks ─────────────────────────────────────────────────────────────────── */

const mockPublish = jest.fn().mockResolvedValue('evt-id');

jest.mock('../../src/config/database', () => ({
  prisma: {
    review: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn(),
    },
  },
}));

jest.mock('../../src/config', () => ({
  config: { VENDOR_SERVICE_URL: 'http://vendor:4003' },
}));

jest.mock('axios');

jest.mock('@wedding-os/shared-events', () => ({
  getEventBus: jest.fn(() => ({ publish: mockPublish })),
}));

jest.mock('../../src/utils/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

/* ── Helpers ───────────────────────────────────────────────────────────────── */

import { prisma } from '../../src/config/database';
import axios from 'axios';

const review = prisma.review as any;
const mockedAxios = axios as jest.Mocked<typeof axios>;

const CUSTOMER_ID = 'cust-1';
const VENDOR_ID = 'vendor-1';
const BOOKING_ID = 'booking-1';
const REVIEW_ID = 'review-1';

const sampleReviewData = {
  bookingId: BOOKING_ID,
  vendorId: VENDOR_ID,
  rating: 5,
  body: 'Excellent service!',
  title: 'Great photographer',
};

const sampleReview = {
  id: REVIEW_ID,
  customerId: CUSTOMER_ID,
  ...sampleReviewData,
  isPublished: true,
  helpfulCount: 0,
  createdAt: new Date(),
};

beforeEach(() => jest.clearAllMocks());

/* ── Tests ─────────────────────────────────────────────────────────────────── */

describe('reviewService', () => {
  /* ── createReview ───────────────────────────────────────────────────────── */

  describe('createReview', () => {
    it('creates a review and recalculates vendor rating', async () => {
      review.findUnique.mockResolvedValue(null); // no duplicate
      review.create.mockResolvedValue(sampleReview);
      review.aggregate.mockResolvedValue({ _avg: { rating: 4.5 }, _count: { rating: 10 } });
      mockedAxios.patch.mockResolvedValue({ data: {} });

      const result = await reviewService.createReview(CUSTOMER_ID, sampleReviewData);

      expect(review.findUnique).toHaveBeenCalledWith({ where: { bookingId: BOOKING_ID } });
      expect(review.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ customerId: CUSTOMER_ID, rating: 5, isPublished: true }),
      });
      expect(review.aggregate).toHaveBeenCalled();
      expect(result).toEqual(sampleReview);
    });

    it('throws 409 if duplicate booking review exists', async () => {
      review.findUnique.mockResolvedValue(sampleReview);

      await expect(reviewService.createReview(CUSTOMER_ID, sampleReviewData))
        .rejects
        .toMatchObject({ statusCode: 409, code: 'RES_3002' });

      expect(review.create).not.toHaveBeenCalled();
    });

    it('publishes review.created event', async () => {
      review.findUnique.mockResolvedValue(null);
      review.create.mockResolvedValue(sampleReview);
      review.aggregate.mockResolvedValue({ _avg: { rating: 5 }, _count: { rating: 1 } });
      mockedAxios.patch.mockResolvedValue({ data: {} });

      await reviewService.createReview(CUSTOMER_ID, sampleReviewData);

      expect(mockPublish).toHaveBeenCalledWith(
        'review.created',
        REVIEW_ID,
        'review',
        expect.objectContaining({ reviewId: REVIEW_ID, customerId: CUSTOMER_ID, vendorId: VENDOR_ID }),
      );
    });
  });

  /* ── getVendorReviews ───────────────────────────────────────────────────── */

  describe('getVendorReviews', () => {
    it('returns paginated results with stats', async () => {
      review.findMany.mockResolvedValue([sampleReview]);
      review.count.mockResolvedValue(1);
      review.aggregate.mockResolvedValue({
        _avg: { rating: 4.5, qualityRating: 4.0, valueRating: 4.2, professionalismRating: 4.8, punctualityRating: 4.6 },
        _count: { id: 1 },
      });

      const result = await reviewService.getVendorReviews(VENDOR_ID, 1, 20);

      expect(result.reviews).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.totalPages).toBe(1);
      expect(result.stats).toBeDefined();
      expect(review.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: { vendorId: VENDOR_ID, isPublished: true },
        skip: 0,
        take: 20,
      }));
    });
  });

  /* ── replyToReview ──────────────────────────────────────────────────────── */

  describe('replyToReview', () => {
    it('updates review with vendor reply', async () => {
      const reply = 'Thank you for the kind words!';
      review.findFirst.mockResolvedValue(sampleReview);
      review.update.mockResolvedValue({ ...sampleReview, vendorReply: reply });

      const result = await reviewService.replyToReview(VENDOR_ID, REVIEW_ID, reply);

      expect(review.findFirst).toHaveBeenCalledWith({ where: { id: REVIEW_ID, vendorId: VENDOR_ID } });
      expect(review.update).toHaveBeenCalledWith({
        where: { id: REVIEW_ID },
        data: expect.objectContaining({ vendorReply: reply }),
      });
      expect(result.vendorReply).toBe(reply);
    });

    it('throws 404 if review not found', async () => {
      review.findFirst.mockResolvedValue(null);

      await expect(reviewService.replyToReview(VENDOR_ID, REVIEW_ID, 'reply'))
        .rejects
        .toMatchObject({ statusCode: 404, code: 'RES_3001' });
    });
  });

  /* ── markHelpful ────────────────────────────────────────────────────────── */

  describe('markHelpful', () => {
    it('increments helpful count', async () => {
      review.update.mockResolvedValue({ ...sampleReview, helpfulCount: 1 });

      const result = await reviewService.markHelpful(REVIEW_ID);

      expect(review.update).toHaveBeenCalledWith({
        where: { id: REVIEW_ID },
        data: { helpfulCount: { increment: 1 } },
      });
      expect(result.helpfulCount).toBe(1);
    });
  });

  /* ── getMyReviews ───────────────────────────────────────────────────────── */

  describe('getMyReviews', () => {
    it("returns customer's reviews with pagination", async () => {
      review.findMany.mockResolvedValue([sampleReview]);
      review.count.mockResolvedValue(1);

      const result = await reviewService.getMyReviews(CUSTOMER_ID, 1, 20);

      expect(result.reviews).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.totalPages).toBe(1);
      expect(review.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: { customerId: CUSTOMER_ID },
      }));
    });
  });
});
