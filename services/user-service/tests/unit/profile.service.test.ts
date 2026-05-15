import { profileService } from '../../src/services/profile.service';

/* ── Mocks ─────────────────────────────────────────────────────────────────── */

const mockPublish = jest.fn().mockResolvedValue('evt-id');

jest.mock('../../src/config/database', () => ({
  prisma: {
    userProfile: {
      upsert: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    pushToken: {
      upsert: jest.fn(),
      updateMany: jest.fn(),
    },
    kycDocument: {
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock('@wedding-os/shared-events', () => ({
  getEventBus: jest.fn(() => ({ publish: mockPublish })),
}));

jest.mock('../../src/utils/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

/* ── Helpers ───────────────────────────────────────────────────────────────── */

import { prisma } from '../../src/config/database';

const userProfile = prisma.userProfile as any;
const pushToken = prisma.pushToken as any;
const kycDocument = prisma.kycDocument as any;

const USER_ID = 'user-1';
const PROFILE_ID = 'profile-1';
const DOC_ID = 'doc-1';

const sampleProfile = {
  id: PROFILE_ID,
  userId: USER_ID,
  firstName: null,
  lastName: null,
  email: null,
  avatar: null,
  kycDocuments: [],
  createdAt: new Date(),
  updatedAt: new Date(),
};

beforeEach(() => jest.clearAllMocks());

/* ── Tests ─────────────────────────────────────────────────────────────────── */

describe('profileService', () => {
  /* ── getOrCreateProfile ─────────────────────────────────────────────────── */

  describe('getOrCreateProfile', () => {
    it('creates profile if not exists', async () => {
      userProfile.upsert.mockResolvedValue(sampleProfile);

      const result = await profileService.getOrCreateProfile(USER_ID);

      expect(userProfile.upsert).toHaveBeenCalledWith({
        where: { userId: USER_ID },
        update: {},
        create: { userId: USER_ID },
        include: { kycDocuments: true },
      });
      expect(result).toEqual(sampleProfile);
    });
  });

  /* ── updateProfile ──────────────────────────────────────────────────────── */

  describe('updateProfile', () => {
    it('updates with date conversion', async () => {
      const dateStr = '2025-12-25T00:00:00.000Z';
      const updatedProfile = { ...sampleProfile, firstName: 'Priya', weddingDate: new Date(dateStr) };
      userProfile.upsert.mockResolvedValue(updatedProfile);

      const result = await profileService.updateProfile(USER_ID, {
        firstName: 'Priya',
        weddingDate: dateStr,
      });

      expect(userProfile.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: USER_ID },
          update: expect.objectContaining({
            firstName: 'Priya',
            weddingDate: expect.any(Date),
          }),
          create: expect.objectContaining({
            userId: USER_ID,
            firstName: 'Priya',
            weddingDate: expect.any(Date),
          }),
        }),
      );
      expect(result.firstName).toBe('Priya');
    });

    it('publishes profile_updated event', async () => {
      userProfile.upsert.mockResolvedValue(sampleProfile);

      await profileService.updateProfile(USER_ID, { firstName: 'Priya' });

      expect(mockPublish).toHaveBeenCalledWith(
        'user.profile_updated',
        USER_ID,
        'user',
        expect.objectContaining({ userId: USER_ID }),
      );
    });
  });

  /* ── updateNotifPrefs ───────────────────────────────────────────────────── */

  describe('updateNotifPrefs', () => {
    it('updates notification preferences', async () => {
      const updatedProfile = { ...sampleProfile, pushNotif: true, emailNotif: false };
      userProfile.update.mockResolvedValue(updatedProfile);

      const result = await profileService.updateNotifPrefs(USER_ID, {
        pushNotif: true,
        emailNotif: false,
      });

      expect(userProfile.update).toHaveBeenCalledWith({
        where: { userId: USER_ID },
        data: { pushNotif: true, emailNotif: false },
      });
      expect(result.pushNotif).toBe(true);
    });
  });

  /* ── registerPushToken ──────────────────────────────────────────────────── */

  describe('registerPushToken', () => {
    it('creates new push token', async () => {
      const token = 'fcm-token-123';
      const savedToken = { id: 'tok-1', profileId: PROFILE_ID, token, platform: 'android', active: true };
      userProfile.upsert.mockResolvedValue(sampleProfile); // getOrCreateProfile
      pushToken.upsert.mockResolvedValue(savedToken);

      const result = await profileService.registerPushToken(USER_ID, token, 'android', 'device-1');

      expect(pushToken.upsert).toHaveBeenCalledWith({
        where: { token },
        update: { active: true, deviceId: 'device-1', platform: 'android' },
        create: { profileId: PROFILE_ID, token, platform: 'android', deviceId: 'device-1', active: true },
      });
      expect(result.active).toBe(true);
    });
  });

  /* ── deactivatePushToken ────────────────────────────────────────────────── */

  describe('deactivatePushToken', () => {
    it('deactivates token', async () => {
      pushToken.updateMany.mockResolvedValue({ count: 1 });

      const result = await profileService.deactivatePushToken('fcm-token-123');

      expect(pushToken.updateMany).toHaveBeenCalledWith({
        where: { token: 'fcm-token-123' },
        data: { active: false },
      });
      expect(result.count).toBe(1);
    });
  });

  /* ── initiateKycUpload ──────────────────────────────────────────────────── */

  describe('initiateKycUpload', () => {
    it('creates KYC document', async () => {
      const kycDoc = { id: DOC_ID, profileId: PROFILE_ID, docType: 'AADHAAR', s3Key: 'kyc/aadhaar.pdf', status: 'PENDING' };
      userProfile.upsert.mockResolvedValue(sampleProfile); // getOrCreateProfile
      kycDocument.create.mockResolvedValue(kycDoc);

      const result = await profileService.initiateKycUpload(USER_ID, 'AADHAAR', 'kyc/aadhaar.pdf');

      expect(kycDocument.create).toHaveBeenCalledWith({
        data: {
          profileId: PROFILE_ID,
          docType: 'AADHAAR',
          s3Key: 'kyc/aadhaar.pdf',
          status: 'PENDING',
        },
      });
      expect(result.status).toBe('PENDING');
    });
  });

  /* ── reviewKyc ──────────────────────────────────────────────────────────── */

  describe('reviewKyc', () => {
    it('approves KYC and publishes event', async () => {
      const approvedDoc = { id: DOC_ID, status: 'APPROVED', reviewedBy: 'admin-1', reviewNote: null };
      kycDocument.update.mockResolvedValue(approvedDoc);

      const result = await profileService.reviewKyc(DOC_ID, 'APPROVED', 'admin-1');

      expect(kycDocument.update).toHaveBeenCalledWith({
        where: { id: DOC_ID },
        data: expect.objectContaining({
          status: 'APPROVED',
          reviewedBy: 'admin-1',
          reviewedAt: expect.any(Date),
        }),
      });
      expect(mockPublish).toHaveBeenCalledWith(
        'user.kyc_approved',
        DOC_ID,
        'user',
        expect.objectContaining({ docId: DOC_ID, status: 'APPROVED' }),
      );
      expect(result.status).toBe('APPROVED');
    });

    it('rejects KYC and publishes event', async () => {
      const rejectedDoc = { id: DOC_ID, status: 'REJECTED', reviewedBy: 'admin-1', reviewNote: 'Blurry image' };
      kycDocument.update.mockResolvedValue(rejectedDoc);

      const result = await profileService.reviewKyc(DOC_ID, 'REJECTED', 'admin-1', 'Blurry image');

      expect(kycDocument.update).toHaveBeenCalledWith({
        where: { id: DOC_ID },
        data: expect.objectContaining({
          status: 'REJECTED',
          reviewNote: 'Blurry image',
        }),
      });
      expect(mockPublish).toHaveBeenCalledWith(
        'user.kyc_rejected',
        DOC_ID,
        'user',
        expect.objectContaining({ docId: DOC_ID, status: 'REJECTED' }),
      );
      expect(result.status).toBe('REJECTED');
    });
  });
});
