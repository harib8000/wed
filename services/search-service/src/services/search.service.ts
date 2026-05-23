import { esClient } from '../config/elasticsearch';
import { ValidationError } from '@wedding-os/shared-errors';
import { logger } from '../utils/logger';

interface EsTotal { value: number; relation: string; }
interface EsAggBucket { key: string; doc_count: number; }
interface EsAggResult { buckets: EsAggBucket[]; }

export const searchService = {
  async searchVendors(params: {
    query?: string;
    category?: string;
    city?: string;
    minPrice?: number;
    maxPrice?: number;
    minRating?: number;
    sortBy?: 'rating' | 'price_asc' | 'price_desc' | 'reviews';
    page?: number;
    limit?: number;
    featured?: boolean;
  }) {
    const { query, category, city, minPrice, maxPrice, minRating, sortBy = 'rating', page = 1, limit = 20, featured } = params;

    if (limit < 1 || limit > 100) throw new ValidationError('Limit must be between 1 and 100', 'limit');
    if (page < 1) throw new ValidationError('Page must be at least 1', 'page');

    const must: Record<string, unknown>[] = [{ term: { verificationStatus: 'verified' } }];
    const filter: Record<string, unknown>[] = [];

    if (query) {
      must.push({
        multi_match: {
          query,
          fields: ['businessName^3', 'description', 'subCategories^2'],
          type: 'best_fields',
          fuzziness: 'AUTO',
        },
      });
    }

    if (category) filter.push({ term: { category } });
    if (city) filter.push({ term: { citiesServed: city.toLowerCase() } });
    if (featured !== undefined) filter.push({ term: { isFeatured: featured } });
    if (minRating) filter.push({ range: { rating: { gte: minRating } } });
    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.push({ range: { basePrice: { ...(minPrice !== undefined && { gte: minPrice }), ...(maxPrice !== undefined && { lte: maxPrice }) } } });
    }

    const sort: Record<string, unknown>[] = [];
    if (sortBy === 'rating') sort.push({ rating: 'desc' }, { totalReviews: 'desc' });
    else if (sortBy === 'price_asc') sort.push({ basePrice: 'asc' });
    else if (sortBy === 'price_desc') sort.push({ basePrice: 'desc' });
    else if (sortBy === 'reviews') sort.push({ totalReviews: 'desc' });

    sort.push({ isFeatured: 'desc' });

    try {
      const result = await esClient.search({
        index: 'vendors',
        from: (page - 1) * limit,
        size: limit,
        query: { bool: { must, filter } },
        sort,
        aggs: {
          categories: { terms: { field: 'category', size: 20 } },
          cities: { terms: { field: 'citiesServed', size: 20 } },
          price_stats: { stats: { field: 'basePrice' } },
        },
      });

      const hits = result.hits.hits.map((h) => ({ ...h._source, _score: h._score }));
      const total = typeof result.hits.total === 'number' ? result.hits.total : (result.hits.total as EsTotal)?.value || 0;

      return {
        vendors: hits,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        aggregations: {
          categories: (result.aggregations?.categories as EsAggResult)?.buckets || [],
          cities: (result.aggregations?.cities as EsAggResult)?.buckets || [],
          priceStats: result.aggregations?.price_stats || {},
        },
      };
    } catch (err) {
      logger.warn({ err }, 'Elasticsearch search failed, returning empty results');
      // Elasticsearch not available - return empty
      return { vendors: [], total: 0, page, limit, totalPages: 0, aggregations: { categories: [], cities: [], priceStats: {} } };
    }
  },

  async indexVendor(vendor: Record<string, unknown>): Promise<void> {
    try {
      await esClient.index({ index: 'vendors', id: vendor.id, document: { ...vendor, updatedAt: new Date().toISOString() } });
    } catch (err) { logger.warn({ err, vendorId: vendor.id }, 'Failed to index vendor (non-fatal)'); }
  },

  async deleteVendor(vendorId: string): Promise<void> {
    try {
      await esClient.delete({ index: 'vendors', id: vendorId });
    } catch (err) { logger.warn({ err, vendorId }, 'Failed to delete vendor from index (non-fatal)'); }
  },

  async autocomplete(query: string): Promise<string[]> {
    try {
      const result = await esClient.search({
        index: 'vendors',
        size: 10,
        query: { match_phrase_prefix: { businessName: { query } } },
        _source: ['businessName'],
      });
      return result.hits.hits.map((h) => (h._source as Record<string, string>).businessName);
    } catch (err) { logger.warn({ err, query }, 'Autocomplete failed'); return []; }
  },
};
