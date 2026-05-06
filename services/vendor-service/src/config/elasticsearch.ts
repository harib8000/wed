import { Client } from '@elastic/elasticsearch';
import { config } from './index';

let _client: Client | null = null;

export function getEsClient(): Client {
  if (!_client) {
    _client = new Client({ node: config.ELASTICSEARCH_URL });
  }
  return _client;
}

export const VENDOR_INDEX = config.ELASTICSEARCH_INDEX;

export interface VendorDocument {
  id: string;
  businessName: string;
  slug: string;
  category: string;
  subCategories: string[];
  status: string;
  city: string;
  state: string;
  serviceCities: string[];
  tagline?: string;
  description?: string;
  avgRating: number;
  reviewCount: number;
  bookingCount: number;
  plusMember: boolean;
  isFeatured: boolean;
  tags: string[];
  priceFromPaise?: number;
  updatedAt: string;
}

export async function upsertVendorDocument(doc: VendorDocument): Promise<void> {
  const client = getEsClient();
  await client.index({
    index: VENDOR_INDEX,
    id: doc.id,
    document: doc,
  });
}

export async function deleteVendorDocument(vendorId: string): Promise<void> {
  const client = getEsClient();
  await client.delete({ index: VENDOR_INDEX, id: vendorId }).catch(() => {
    // ignore 404 — already gone
  });
}

export async function ensureVendorIndex(): Promise<void> {
  const client = getEsClient();
  const exists = await client.indices.exists({ index: VENDOR_INDEX });
  if (!exists) {
    await client.indices.create({
      index: VENDOR_INDEX,
      mappings: {
        properties: {
          id: { type: 'keyword' },
          businessName: { type: 'text', analyzer: 'standard', fields: { keyword: { type: 'keyword' } } },
          slug: { type: 'keyword' },
          category: { type: 'keyword' },
          subCategories: { type: 'keyword' },
          status: { type: 'keyword' },
          city: { type: 'keyword' },
          state: { type: 'keyword' },
          serviceCities: { type: 'keyword' },
          tagline: { type: 'text' },
          description: { type: 'text' },
          avgRating: { type: 'float' },
          reviewCount: { type: 'integer' },
          bookingCount: { type: 'integer' },
          plusMember: { type: 'boolean' },
          isFeatured: { type: 'boolean' },
          tags: { type: 'keyword' },
          priceFromPaise: { type: 'long' },
          updatedAt: { type: 'date' },
        },
      },
      settings: {
        number_of_shards: 1,
        number_of_replicas: 0,
      },
    });
  }
}
