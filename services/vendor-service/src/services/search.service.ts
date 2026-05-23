import { getEsClient, VENDOR_INDEX } from '../config/elasticsearch';

interface EsTotal { value: number; relation: string; }

export interface VendorSearchParams {
  q?: string;
  category?: string;
  city?: string;
  minRating?: number;
  minPricePaise?: number;
  maxPricePaise?: number;
  plusMembersOnly?: boolean;
  page?: number;
  limit?: number;
  sortBy?: 'rating' | 'price_asc' | 'price_desc' | 'bookings' | 'relevance';
}

export const searchService = {
  async search(params: VendorSearchParams) {
    const { q, category, city, minRating, minPricePaise, maxPricePaise, plusMembersOnly, page = 1, limit = 20, sortBy = 'relevance' } = params;

    const must: Record<string, unknown>[] = [{ term: { status: 'ACTIVE' } }];
    const filter: Record<string, unknown>[] = [];

    if (q) {
      must.push({
        multi_match: {
          query: q,
          fields: ['businessName^3', 'tagline^2', 'description', 'tags^2'],
          fuzziness: 'AUTO',
        },
      });
    }

    if (category) filter.push({ term: { category } });
    if (city) filter.push({ bool: { should: [{ term: { city } }, { term: { serviceCities: city } }] } });
    if (minRating) filter.push({ range: { avgRating: { gte: minRating } } });
    if (plusMembersOnly) filter.push({ term: { plusMember: true } });
    if (minPricePaise || maxPricePaise) {
      filter.push({ range: { priceFromPaise: { ...(minPricePaise && { gte: minPricePaise }), ...(maxPricePaise && { lte: maxPricePaise }) } } });
    }

    const sortMap: Record<string, Record<string, unknown>[]> = {
      rating: [{ avgRating: 'desc' }, { reviewCount: 'desc' }],
      price_asc: [{ priceFromPaise: { order: 'asc', missing: '_last' } }],
      price_desc: [{ priceFromPaise: { order: 'desc', missing: '_last' } }],
      bookings: [{ bookingCount: 'desc' }],
      relevance: q ? [{ _score: 'desc' }, { isFeatured: 'desc' }, { plusMember: 'desc' }, { avgRating: 'desc' }] : [{ isFeatured: 'desc' }, { avgRating: 'desc' }],
    };

    const client = getEsClient();
    const response = await client.search({
      index: VENDOR_INDEX,
      from: (page - 1) * limit,
      size: limit,
      query: { bool: { must, filter } },
      sort: sortMap[sortBy] ?? sortMap.relevance,
      _source: true,
    });

    const hits = response.hits.hits;
    const total = typeof response.hits.total === 'number' ? response.hits.total : (response.hits.total as EsTotal)?.value ?? 0;

    return {
      vendors: hits.map((h) => h._source),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  async suggest(prefix: string, city?: string) {
    const client = getEsClient();
    const response = await client.search({
      index: VENDOR_INDEX,
      size: 8,
      query: {
        bool: {
          must: [
            { match_phrase_prefix: { 'businessName': prefix } },
            { term: { status: 'ACTIVE' } },
          ],
          filter: city ? [{ bool: { should: [{ term: { city } }, { term: { serviceCities: city } }] } }] : [],
        },
      },
      _source: ['id', 'businessName', 'slug', 'category', 'city', 'avgRating', 'coverPhoto'],
    });

    return response.hits.hits.map((h) => h._source);
  },
};
