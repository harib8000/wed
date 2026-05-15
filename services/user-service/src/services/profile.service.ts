import { prisma } from '../config/database';
import type { UpdateProfileInput, UpdateNotifPrefsInput } from '../types/user.types';
import { getEventBus, type DomainEventType } from '@wedding-os/shared-events';

function publishEvent(type: DomainEventType, aggregateId: string, payload: Record<string, unknown>) {
  try {
    const bus = getEventBus();
    bus.publish(type, aggregateId, 'user', payload).catch(() => { /* non-blocking */ });
  } catch { /* Event bus not initialized */ }
}

export const profileService = {
  async getOrCreateProfile(userId: string) {
    return prisma.userProfile.upsert({
      where: { userId },
      update: {},
      create: { userId },
      include: { kycDocuments: true },
    });
  },

  async getProfile(userId: string) {
    return prisma.userProfile.findUnique({
      where: { userId },
      include: { kycDocuments: true },
    });
  },

  async updateProfile(userId: string, data: UpdateProfileInput) {
    const profile = await prisma.userProfile.upsert({
      where: { userId },
      update: {
        ...data,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
        weddingDate: data.weddingDate ? new Date(data.weddingDate) : undefined,
      },
      create: {
        userId,
        ...data,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
        weddingDate: data.weddingDate ? new Date(data.weddingDate) : undefined,
      },
    });
    publishEvent('user.profile_updated', userId, { userId });
    return profile;
  },

  async updateNotifPrefs(userId: string, prefs: UpdateNotifPrefsInput) {
    return prisma.userProfile.update({
      where: { userId },
      data: prefs,
    });
  },

  async updateAvatar(userId: string, s3Key: string, publicUrl: string) {
    return prisma.userProfile.update({
      where: { userId },
      data: { avatar: publicUrl },
    });
  },

  async registerPushToken(userId: string, token: string, platform: string, deviceId?: string) {
    const profile = await this.getOrCreateProfile(userId);

    // Upsert based on token value
    return prisma.pushToken.upsert({
      where: { token },
      update: { active: true, deviceId, platform },
      create: { profileId: profile.id, token, platform, deviceId, active: true },
    });
  },

  async deactivatePushToken(token: string) {
    return prisma.pushToken.updateMany({
      where: { token },
      data: { active: false },
    });
  },

  async initiateKycUpload(userId: string, docType: string, s3Key: string) {
    const profile = await this.getOrCreateProfile(userId);
    return prisma.kycDocument.create({
      data: {
        profileId: profile.id,
        docType: docType as any,
        s3Key,
        status: 'PENDING',
      },
    });
  },

  // Admin-only
  async reviewKyc(docId: string, status: 'APPROVED' | 'REJECTED', reviewedBy: string, note?: string) {
    const doc = await prisma.kycDocument.update({
      where: { id: docId },
      data: {
        status,
        reviewNote: note,
        reviewedAt: new Date(),
        reviewedBy,
      },
    });
    const eventType: DomainEventType = status === 'APPROVED' ? 'user.kyc_approved' : 'user.kyc_rejected';
    publishEvent(eventType, docId, { docId, status, reviewedBy });
    return doc;
  },
};
