import { Client } from '@elastic/elasticsearch';
import { config } from './index';
import { logger } from '../utils/logger';

export const esClient = new Client({ node: config.ELASTICSEARCH_URL });

export async function connectElasticsearch(): Promise<void> {
  try {
    await esClient.ping();
    logger.info('Elasticsearch connected');
    await ensureVendorIndex();
  } catch (err) {
    logger.warn({ err }, 'Elasticsearch not available, search features degraded');
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
