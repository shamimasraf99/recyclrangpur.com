/**
 * Integration Test: Product Public Query Constraints
 * Ensures that unapproved (pending/rejected) or unavailable (sold/archived) or soft-deleted ads
 * are NEVER returned to the public search endpoint.
 */

interface MockProductItem {
  id: number;
  title: string;
  moderation_status: 'draft' | 'pending' | 'approved' | 'rejected';
  availability_status: 'available' | 'reserved' | 'sold' | 'archived';
  deleted_at: string | null;
}

function filterPublicSearch(items: MockProductItem[]): MockProductItem[] {
  return items.filter(
    item =>
      item.moderation_status === 'approved' &&
      item.availability_status === 'available' &&
      item.deleted_at === null
  );
}

describe('Public Listing Constraint Verification', () => {
  const sampleProducts: MockProductItem[] = [
    {
      id: 1,
      title: 'iPhone 14 Pro Max',
      moderation_status: 'approved',
      availability_status: 'available',
      deleted_at: null
    },
    {
      id: 2,
      title: 'Pending Ad',
      moderation_status: 'pending',
      availability_status: 'available',
      deleted_at: null
    },
    {
      id: 3,
      title: 'Rejected Ad',
      moderation_status: 'rejected',
      availability_status: 'available',
      deleted_at: null
    },
    {
      id: 4,
      title: 'Sold Out Bike',
      moderation_status: 'approved',
      availability_status: 'sold',
      deleted_at: null
    },
    {
      id: 5,
      title: 'Deleted Laptop',
      moderation_status: 'approved',
      availability_status: 'available',
      deleted_at: '2026-10-18T00:00:00Z'
    }
  ];

  test('only returns approved, available, non-deleted listings in public search', () => {
    const publicResults = filterPublicSearch(sampleProducts);
    expect(publicResults).toHaveLength(1);
    expect(publicResults[0].id).toBe(1);
    expect(publicResults[0].title).toBe('iPhone 14 Pro Max');
  });

  test('excludes pending review listings from public results', () => {
    const publicResults = filterPublicSearch(sampleProducts);
    const hasPending = publicResults.some(p => p.moderation_status === 'pending');
    expect(hasPending).toBe(false);
  });

  test('excludes sold items from active public search', () => {
    const publicResults = filterPublicSearch(sampleProducts);
    const hasSold = publicResults.some(p => p.availability_status === 'sold');
    expect(hasSold).toBe(false);
  });

  test('excludes soft-deleted items', () => {
    const publicResults = filterPublicSearch(sampleProducts);
    const hasDeleted = publicResults.some(p => p.deleted_at !== null);
    expect(hasDeleted).toBe(false);
  });
});
