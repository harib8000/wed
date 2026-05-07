import { Client } from '@elastic/elasticsearch';
import { config } from './index';

export const esClient = new Client({ node: config.ELASTICSEARCH_URL });

export async function connectElasticsearch(): Promise<void> {
  try {
    await esClient.ping();
    console.log('Elasticsearch connected');
    await ensureVendorIndex();
  } catch (err) {
    console.warn('Elasticsearch not available, search features degraded:', err);
  }
}

export async function ensureVendorIndex(): Promise<void> {
  const indexName = 'vendors';
  const exists = await esClient.indices.exists({ index: indexName }).catch(() => false);
  if (!exists) {
    await esClient.indices.create({
      index: indexName,
      mappings: {
        properties: {
          id: { type: 'keyword' },
          businessName: { type: 'text', analyzer: 'standard' },
          category: { type: 'keyword' },
          subCategories: { type: 'keyword' },
          description: { type: 'text' },
          citiesServed: { type: 'keyword' },
          basePrice: { type: 'float' },
          rating: { type: 'float' },
          totalReviews: { type: 'integer' },
          isFeatured: { type: 'boolean' },
          verificationStatus: { type: 'keyword' },
          tags: { type: 'keyword' },
          location: { type: 'geo_point' },
          updatedAt: { type: 'date' },
        },
      },
    });
  }
}
