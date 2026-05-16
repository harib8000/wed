import { searchService } from '../../src/services/search.service';

const mockSearch = jest.fn();
const mockIndex = jest.fn();
const mockDelete = jest.fn();

jest.mock('../../src/config/elasticsearch', () => ({
  esClient: {
    search: (...args: unknown[]) => mockSearch(...args),
    index: (...args: unknown[]) => mockIndex(...args),
    delete: (...args: unknown[]) => mockDelete(...args),
  },
}));

function makeEsResponse(
  hits: Array<{ _source: Record<string, unknown>; _score: number }>,
  total: number | { value: number; relation: string },
  aggregations?: Record<string, unknown>,
) {
  return {
    hits: {
      hits: hits.map((h) => ({ _source: h._source, _score: h._score })),
      total,
    },
    aggregations: aggregations ?? {},
  };
}

const sampleVendor = {
  id: 'v1',
  businessName: 'Royal Photography',
  category: 'photographer',
  citiesServed: ['mumbai', 'pune'],
  basePrice: 50000,
  rating: 4.5,
  totalReviews: 120,
  isFeatured: true,
  verificationStatus: 'verified',
};

beforeEach(() => jest.clearAllMocks());

// ── searchVendors ─────────────────────────────────────────────

describe('searchService.searchVendors', () => {
  it('returns results with pagination metadata', async () => {
    mockSearch.mockResolvedValueOnce(
      makeEsResponse([{ _source: sampleVendor, _score: 1.0 }], { value: 1, relation: 'eq' }),
    );

    const res = await searchService.searchVendors({ page: 1, limit: 20 });

    expect(res.vendors).toHaveLength(1);
    expect(res.total).toBe(1);
    expect(res.page).toBe(1);
    expect(res.limit).toBe(20);
    expect(res.totalPages).toBe(1);
  });

  it('applies category filter', async () => {
    mockSearch.mockResolvedValueOnce(makeEsResponse([], 0));

    await searchService.searchVendors({ category: 'photographer' });

    const callArgs = mockSearch.mock.calls[0][0];
    expect(callArgs.query.bool.filter).toContainEqual({ term: { category: 'photographer' } });
  });

  it('applies city filter lowercased', async () => {
    mockSearch.mockResolvedValueOnce(makeEsResponse([], 0));

    await searchService.searchVendors({ city: 'Mumbai' });

    const callArgs = mockSearch.mock.calls[0][0];
    expect(callArgs.query.bool.filter).toContainEqual({ term: { citiesServed: 'mumbai' } });
  });

  it('applies price range filter', async () => {
    mockSearch.mockResolvedValueOnce(makeEsResponse([], 0));

    await searchService.searchVendors({ minPrice: 10000, maxPrice: 50000 });

    const callArgs = mockSearch.mock.calls[0][0];
    expect(callArgs.query.bool.filter).toContainEqual({
      range: { basePrice: { gte: 10000, lte: 50000 } },
    });
  });

  it('applies rating filter', async () => {
    mockSearch.mockResolvedValueOnce(makeEsResponse([], 0));

    await searchService.searchVendors({ minRating: 4.0 });

    const callArgs = mockSearch.mock.calls[0][0];
    expect(callArgs.query.bool.filter).toContainEqual({ range: { rating: { gte: 4.0 } } });
  });

  it('applies featured filter', async () => {
    mockSearch.mockResolvedValueOnce(makeEsResponse([], 0));

    await searchService.searchVendors({ featured: true });

    const callArgs = mockSearch.mock.calls[0][0];
    expect(callArgs.query.bool.filter).toContainEqual({ term: { isFeatured: true } });
  });

  it('applies fuzzy text query with field boosts', async () => {
    mockSearch.mockResolvedValueOnce(makeEsResponse([], 0));

    await searchService.searchVendors({ query: 'wedding photos' });

    const callArgs = mockSearch.mock.calls[0][0];
    const multiMatch = callArgs.query.bool.must.find((m: any) => m.multi_match);
    expect(multiMatch).toBeDefined();
    expect(multiMatch.multi_match.query).toBe('wedding photos');
    expect(multiMatch.multi_match.fields).toEqual(['businessName^3', 'description', 'subCategories^2']);
    expect(multiMatch.multi_match.fuzziness).toBe('AUTO');
  });

  it.each([
    ['rating', [{ rating: 'desc' }, { totalReviews: 'desc' }, { isFeatured: 'desc' }]],
    ['price_asc', [{ basePrice: 'asc' }, { isFeatured: 'desc' }]],
    ['price_desc', [{ basePrice: 'desc' }, { isFeatured: 'desc' }]],
    ['reviews', [{ totalReviews: 'desc' }, { isFeatured: 'desc' }]],
  ] as const)('sorts by %s', async (sortBy, expectedSort) => {
    mockSearch.mockResolvedValueOnce(makeEsResponse([], 0));

    await searchService.searchVendors({ sortBy: sortBy as any });

    const callArgs = mockSearch.mock.calls[0][0];
    expect(callArgs.sort).toEqual(expectedSort);
  });

  it('returns aggregations (categories, cities)', async () => {
    const aggs = {
      categories: { buckets: [{ key: 'photographer', doc_count: 10 }] },
      cities: { buckets: [{ key: 'mumbai', doc_count: 5 }] },
      price_stats: { count: 10, min: 5000, max: 100000, avg: 35000 },
    };
    mockSearch.mockResolvedValueOnce(makeEsResponse([], { value: 0, relation: 'eq' }, aggs));

    const res = await searchService.searchVendors({});

    expect(res.aggregations.categories).toEqual([{ key: 'photographer', doc_count: 10 }]);
    expect(res.aggregations.cities).toEqual([{ key: 'mumbai', doc_count: 5 }]);
    expect(res.aggregations.priceStats).toEqual(aggs.price_stats);
  });

  it('handles empty results gracefully', async () => {
    mockSearch.mockResolvedValueOnce(makeEsResponse([], 0));

    const res = await searchService.searchVendors({ query: 'nonexistent' });

    expect(res.vendors).toEqual([]);
    expect(res.total).toBe(0);
    expect(res.totalPages).toBe(0);
  });

  it('returns fallback when ES is unavailable', async () => {
    mockSearch.mockRejectedValueOnce(new Error('connection refused'));

    const res = await searchService.searchVendors({});

    expect(res.vendors).toEqual([]);
    expect(res.total).toBe(0);
    expect(res.totalPages).toBe(0);
    expect(res.aggregations).toEqual({ categories: [], cities: [], priceStats: {} });
  });
});

// ── indexVendor ───────────────────────────────────────────────

describe('searchService.indexVendor', () => {
  it('indexes document with correct id and body', async () => {
    mockIndex.mockResolvedValueOnce({});

    await searchService.indexVendor(sampleVendor);

    expect(mockIndex).toHaveBeenCalledTimes(1);
    const callArgs = mockIndex.mock.calls[0][0];
    expect(callArgs.index).toBe('vendors');
    expect(callArgs.id).toBe('v1');
    expect(callArgs.document.businessName).toBe('Royal Photography');
    expect(callArgs.document.updatedAt).toBeDefined();
  });
});

// ── deleteVendor ──────────────────────────────────────────────

describe('searchService.deleteVendor', () => {
  it('deletes correct document', async () => {
    mockDelete.mockResolvedValueOnce({});

    await searchService.deleteVendor('v1');

    expect(mockDelete).toHaveBeenCalledWith({ index: 'vendors', id: 'v1' });
  });
});

// ── autocomplete ──────────────────────────────────────────────

describe('searchService.autocomplete', () => {
  it('returns business names matching prefix', async () => {
    mockSearch.mockResolvedValueOnce({
      hits: {
        hits: [
          { _source: { businessName: 'Royal Photography' }, _score: 1.0 },
          { _source: { businessName: 'Royal Catering' }, _score: 0.8 },
        ],
        total: 2,
      },
    });

    const results = await searchService.autocomplete('Royal');

    expect(results).toEqual(['Royal Photography', 'Royal Catering']);
    const callArgs = mockSearch.mock.calls[0][0];
    expect(callArgs.query.match_phrase_prefix.businessName.query).toBe('Royal');
    expect(callArgs.size).toBe(10);
    expect(callArgs._source).toEqual(['businessName']);
  });

  it('returns empty array for no matches', async () => {
    mockSearch.mockResolvedValueOnce({ hits: { hits: [], total: 0 } });

    const results = await searchService.autocomplete('zzzzz');

    expect(results).toEqual([]);
  });

  it('returns empty array when ES fails', async () => {
    mockSearch.mockRejectedValueOnce(new Error('connection refused'));

    const results = await searchService.autocomplete('Royal');

    expect(results).toEqual([]);
  });
});
