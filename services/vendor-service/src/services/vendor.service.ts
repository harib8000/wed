import { prisma } from '../config/database';
import { upsertVendorDocument, deleteVendorDocument } from '../config/elasticsearch';
import type { Vendor, VendorPackage, Prisma, VendorCategory } from '@prisma/client';
import { getEventBus, type DomainEventType } from '@wedding-os/shared-events';
import { logger } from '../utils/logger';
import { NotFoundError } from '@wedding-os/shared-errors';

function publishEvent(type: DomainEventType, aggregateId: string, payload: Record<string, unknown>) {
  try {
    const bus = getEventBus();
    bus.publish(type, aggregateId, 'vendor', payload).catch((err: unknown) =>
      logger.warn({ err, type }, 'Event publish failed (non-blocking)')
    );
  } catch { /* Event bus not initialized (e.g., in tests) */ }
}

function buildSlug(name: string, city: string): string {
  const base = `${name} ${city}`
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
  const suffix = Math.random().toString(36).slice(2, 7);
  return `${base}-${suffix}`;
}

async function syncToEs(vendor: Vendor & { packages?: VendorPackage[]; tags?: { tag: string }[] }) {
  const minPrice = vendor.packages?.length
    ? Math.min(...vendor.packages.filter((p) => p.isActive).map((p) => p.priceFromPaise))
    : undefined;

  await upsertVendorDocument({
    id: vendor.id,
    businessName: vendor.businessName,
    slug: vendor.slug,
    category: vendor.category,
    subCategories: vendor.subCategories,
    status: vendor.status,
    city: vendor.city,
    state: vendor.state,
    serviceCities: vendor.serviceCities,
    tagline: vendor.tagline ?? undefined,
    description: vendor.description ?? undefined,
    avgRating: vendor.avgRating,
    reviewCount: vendor.reviewCount,
    bookingCount: vendor.bookingCount,
    plusMember: vendor.plusMember,
    isFeatured: vendor.isFeatured,
    tags: vendor.tags?.map((t) => t.tag) ?? [],
    priceFromPaise: minPrice,
    updatedAt: vendor.updatedAt.toISOString(),
  }).catch((err) => {
    logger.error({ err, vendorId: vendor.id }, 'ES sync failed — search index may be stale');
  });
}

export const vendorService = {
  async create(userId: string, data: {
    businessName: string;
    category: string;
    city: string;
    state: string;
    pincode: string;
  }) {
    const slug = buildSlug(data.businessName, data.city);
    const vendor = await prisma.vendor.create({
      data: {
        userId,
        businessName: data.businessName,
        slug,
        category: data.category as VendorCategory,
        city: data.city,
        state: data.state,
        pincode: data.pincode,
      },
    });
    await syncToEs(vendor);
    publishEvent('vendor.registered', vendor.id, { vendorId: vendor.id, userId, businessName: data.businessName, category: data.category, city: data.city });
    return vendor;
  },

  async getBySlug(slug: string) {
    return prisma.vendor.findUnique({
      where: { slug },
      include: { packages: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } }, portfolio: { orderBy: { sortOrder: 'asc' } }, tags: true },
    });
  },

  async getByUserId(userId: string) {
    return prisma.vendor.findUnique({
      where: { userId },
      include: { packages: { orderBy: { sortOrder: 'asc' } }, portfolio: true, tags: true, availability: { where: { blockedDate: { gte: new Date() } } } },
    });
  },

  async update(vendorId: string, data: Prisma.VendorUpdateInput) {
    const vendor = await prisma.vendor.update({
      where: { id: vendorId },
      data,
      include: { packages: true, tags: true },
    });
    await syncToEs(vendor);
    publishEvent('vendor.profile_updated', vendor.id, { vendorId: vendor.id });
    return vendor;
  },

  async upsertPackage(vendorId: string, packageData: {
    id?: string;
    name: string;
    packageType: string;
    priceFromPaise: number;
    priceUpToPaise?: number;
    isCustomQuote?: boolean;
    description?: string;
    inclusions?: string[];
    exclusions?: string[];
    deliverables?: string[];
  }) {
    const { id: _id, ...pkgFields } = packageData;
    const pkg = packageData.id
      ? await prisma.vendorPackage.update({
          where: { id: packageData.id },
          data: { ...pkgFields, vendorId },
        })
      : await prisma.vendorPackage.create({
          data: { ...pkgFields, vendorId } as Prisma.VendorPackageUncheckedCreateInput,
        });

    // Re-sync to ES
    const vendor = await prisma.vendor.findUnique({ where: { id: vendorId }, include: { packages: true, tags: true } });
    if (vendor) await syncToEs(vendor);
    return pkg;
  },

  async deletePackage(vendorId: string, packageId: string) {
    await prisma.vendorPackage.deleteMany({ where: { id: packageId, vendorId } });
    const vendor = await prisma.vendor.findUnique({ where: { id: vendorId }, include: { packages: true, tags: true } });
    if (vendor) await syncToEs(vendor);
  },

  async addPortfolioItem(vendorId: string, s3Key: string, publicUrl: string, caption?: string, mediaType?: string) {
    return prisma.portfolioItem.create({
      data: { vendorId, s3Key, publicUrl, caption, mediaType: mediaType ?? 'image' },
    });
  },

  async deletePortfolioItem(vendorId: string, itemId: string) {
    return prisma.portfolioItem.deleteMany({ where: { id: itemId, vendorId } });
  },

  async setAvailability(vendorId: string, blockedDates: { date: string; reason?: string }[]) {
    // Replace all future blocked dates for this vendor
    await prisma.availabilityBlock.deleteMany({
      where: { vendorId, blockedDate: { gte: new Date() } },
    });
    if (blockedDates.length) {
      await prisma.availabilityBlock.createMany({
        data: blockedDates.map((b) => ({
          vendorId,
          blockedDate: new Date(b.date),
          reason: b.reason,
        })),
        skipDuplicates: true,
      });
    }
  },

  async isAvailable(vendorId: string, date: Date): Promise<boolean> {
    const block = await prisma.availabilityBlock.findUnique({
      where: { vendorId_blockedDate: { vendorId, blockedDate: date } },
    });
    return !block;
  },

  async setTags(vendorId: string, tags: string[]) {
    await prisma.vendorTag.deleteMany({ where: { vendorId } });
    if (tags.length) {
      await prisma.vendorTag.createMany({
        data: tags.map((tag) => ({ vendorId, tag })),
        skipDuplicates: true,
      });
    }
    const vendor = await prisma.vendor.findUnique({ where: { id: vendorId }, include: { packages: true, tags: true } });
    if (vendor) await syncToEs(vendor);
  },

  async submitForReview(vendorId: string) {
    return prisma.vendor.update({
      where: { id: vendorId },
      data: { status: 'PENDING_REVIEW' },
    });
  },

  // ── Admin ──────────────────────────────────────────────────────────────────

  async approveVendor(vendorId: string) {
    const vendor = await prisma.vendor.update({
      where: { id: vendorId },
      data: { status: 'ACTIVE' },
      include: { packages: true, tags: true },
    });
    await syncToEs(vendor);
    publishEvent('vendor.kyc_approved', vendor.id, { vendorId: vendor.id, businessName: vendor.businessName });
    return vendor;
  },

  async suspendVendor(vendorId: string, note?: string) {
    const vendor = await prisma.vendor.update({
      where: { id: vendorId },
      data: { status: 'SUSPENDED', adminNote: note },
      include: { packages: true, tags: true },
    });
    await deleteVendorDocument(vendorId);
    publishEvent('vendor.kyc_rejected', vendor.id, { vendorId, note });
    return vendor;
  },

  async updateRatingStats(vendorId: string, avgRating: number, reviewCount: number) {
    const vendor = await prisma.vendor.update({
      where: { id: vendorId },
      data: { avgRating, reviewCount },
      include: { packages: true, tags: true },
    });
    await syncToEs(vendor);
    return vendor;
  },
};
