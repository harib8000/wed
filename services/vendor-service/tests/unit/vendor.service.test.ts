import { vendorService } from '../../src/services/vendor.service';

/* ── Mocks ─────────────────────────────────────────────────────────────────── */

const mockPublish = jest.fn().mockResolvedValue('evt-id');

jest.mock('../../src/config/database', () => ({
  prisma: {
    vendor: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    vendorPackage: {
      create: jest.fn(),
      update: jest.fn(),
      deleteMany: jest.fn(),
    },
    availabilityBlock: {
      findUnique: jest.fn(),
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
    vendorTag: {
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
    portfolioItem: {
      create: jest.fn(),
      deleteMany: jest.fn(),
    },
  },
}));

jest.mock('../../src/config/elasticsearch', () => ({
  upsertVendorDocument: jest.fn().mockResolvedValue(undefined),
  deleteVendorDocument: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@wedding-os/shared-events', () => ({
  getEventBus: jest.fn(() => ({ publish: mockPublish })),
}));

/* ── Helpers ───────────────────────────────────────────────────────────────── */

import { prisma } from '../../src/config/database';
import { upsertVendorDocument, deleteVendorDocument } from '../../src/config/elasticsearch';

const vendor = prisma.vendor as any;
const availabilityBlock = prisma.availabilityBlock as any;
const mockedUpsert = upsertVendorDocument as jest.Mock;
const mockedDelete = deleteVendorDocument as jest.Mock;

const USER_ID = 'user-1';
const VENDOR_ID = 'vendor-1';

const sampleVendor = {
  id: VENDOR_ID,
  userId: USER_ID,
  businessName: 'Royal Photography',
  slug: 'royal-photography-mumbai-abc12',
  category: 'PHOTOGRAPHY',
  city: 'Mumbai',
  state: 'Maharashtra',
  pincode: '400001',
  status: 'DRAFT',
  subCategories: [],
  serviceCities: ['Mumbai'],
  tagline: null,
  description: null,
  avgRating: 0,
  reviewCount: 0,
  bookingCount: 0,
  plusMember: false,
  isFeatured: false,
  adminNote: null,
  updatedAt: new Date(),
  packages: [],
  tags: [],
};

beforeEach(() => jest.clearAllMocks());

/* ── Tests ─────────────────────────────────────────────────────────────────── */

describe('vendorService', () => {
  /* ── create ─────────────────────────────────────────────────────────────── */

  describe('create', () => {
    it('creates vendor with generated slug', async () => {
      vendor.create.mockResolvedValue(sampleVendor);

      const result = await vendorService.create(USER_ID, {
        businessName: 'Royal Photography',
        category: 'PHOTOGRAPHY',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001',
      });

      expect(vendor.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: USER_ID,
          businessName: 'Royal Photography',
          slug: expect.any(String),
          category: 'PHOTOGRAPHY',
        }),
      });
      expect(result.id).toBe(VENDOR_ID);
    });

    it('publishes vendor.registered event', async () => {
      vendor.create.mockResolvedValue(sampleVendor);

      await vendorService.create(USER_ID, {
        businessName: 'Royal Photography',
        category: 'PHOTOGRAPHY',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001',
      });

      expect(mockPublish).toHaveBeenCalledWith(
        'vendor.registered',
        VENDOR_ID,
        'vendor',
        expect.objectContaining({ vendorId: VENDOR_ID, userId: USER_ID }),
      );
    });
  });

  /* ── update ─────────────────────────────────────────────────────────────── */

  describe('update', () => {
    it('updates vendor and syncs to ES', async () => {
      const updatedVendor = { ...sampleVendor, tagline: 'Best in Mumbai' };
      vendor.update.mockResolvedValue(updatedVendor);

      const result = await vendorService.update(VENDOR_ID, { tagline: 'Best in Mumbai' });

      expect(vendor.update).toHaveBeenCalledWith({
        where: { id: VENDOR_ID },
        data: { tagline: 'Best in Mumbai' },
        include: { packages: true, tags: true },
      });
      expect(mockedUpsert).toHaveBeenCalled();
      expect(mockPublish).toHaveBeenCalledWith(
        'vendor.profile_updated',
        VENDOR_ID,
        'vendor',
        expect.objectContaining({ vendorId: VENDOR_ID }),
      );
      expect(result.tagline).toBe('Best in Mumbai');
    });
  });

  /* ── approveVendor ──────────────────────────────────────────────────────── */

  describe('approveVendor', () => {
    it('sets status to ACTIVE and publishes kyc_approved', async () => {
      const approvedVendor = { ...sampleVendor, status: 'ACTIVE' };
      vendor.update.mockResolvedValue(approvedVendor);

      const result = await vendorService.approveVendor(VENDOR_ID);

      expect(vendor.update).toHaveBeenCalledWith({
        where: { id: VENDOR_ID },
        data: { status: 'ACTIVE' },
        include: { packages: true, tags: true },
      });
      expect(mockedUpsert).toHaveBeenCalled();
      expect(mockPublish).toHaveBeenCalledWith(
        'vendor.kyc_approved',
        VENDOR_ID,
        'vendor',
        expect.objectContaining({ vendorId: VENDOR_ID }),
      );
      expect(result.status).toBe('ACTIVE');
    });
  });

  /* ── suspendVendor ──────────────────────────────────────────────────────── */

  describe('suspendVendor', () => {
    it('sets status SUSPENDED and deletes from ES', async () => {
      const suspendedVendor = { ...sampleVendor, status: 'SUSPENDED', adminNote: 'Policy violation' };
      vendor.update.mockResolvedValue(suspendedVendor);

      const result = await vendorService.suspendVendor(VENDOR_ID, 'Policy violation');

      expect(vendor.update).toHaveBeenCalledWith({
        where: { id: VENDOR_ID },
        data: { status: 'SUSPENDED', adminNote: 'Policy violation' },
        include: { packages: true, tags: true },
      });
      expect(mockedDelete).toHaveBeenCalledWith(VENDOR_ID);
      expect(mockPublish).toHaveBeenCalledWith(
        'vendor.kyc_rejected',
        VENDOR_ID,
        'vendor',
        expect.objectContaining({ vendorId: VENDOR_ID, note: 'Policy violation' }),
      );
      expect(result.status).toBe('SUSPENDED');
    });
  });

  /* ── updateRatingStats ──────────────────────────────────────────────────── */

  describe('updateRatingStats', () => {
    it('updates rating and syncs to ES', async () => {
      const updatedVendor = { ...sampleVendor, avgRating: 4.5, reviewCount: 10 };
      vendor.update.mockResolvedValue(updatedVendor);

      const result = await vendorService.updateRatingStats(VENDOR_ID, 4.5, 10);

      expect(vendor.update).toHaveBeenCalledWith({
        where: { id: VENDOR_ID },
        data: { avgRating: 4.5, reviewCount: 10 },
        include: { packages: true, tags: true },
      });
      expect(mockedUpsert).toHaveBeenCalled();
      expect(result.avgRating).toBe(4.5);
      expect(result.reviewCount).toBe(10);
    });
  });

  /* ── isAvailable ────────────────────────────────────────────────────────── */

  describe('isAvailable', () => {
    const testDate = new Date('2025-03-15');

    it('returns true when no block exists', async () => {
      availabilityBlock.findUnique.mockResolvedValue(null);

      const result = await vendorService.isAvailable(VENDOR_ID, testDate);

      expect(result).toBe(true);
      expect(availabilityBlock.findUnique).toHaveBeenCalledWith({
        where: { vendorId_blockedDate: { vendorId: VENDOR_ID, blockedDate: testDate } },
      });
    });

    it('returns false when block exists', async () => {
      availabilityBlock.findUnique.mockResolvedValue({ id: 'block-1', vendorId: VENDOR_ID, blockedDate: testDate });

      const result = await vendorService.isAvailable(VENDOR_ID, testDate);

      expect(result).toBe(false);
    });
  });
});
