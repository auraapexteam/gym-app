import { vi } from 'vitest';
import { logger } from '@/config/logger';

// Silence logging during tests
logger.level = 'silent';

// Global table mock registry
export const testDbRegistry: {
  mocks: Record<string, any>;
  reset: () => void;
} = {
  mocks: {},
  reset() {
    this.mocks = {};
  },
};

// Global mocks
vi.mock('@/config/supabase', () => {
  const createMockChain = () => {
    let currentTable = '';
    let appliedFilters: Array<{ column: string; value: any }> = [];

    const getFilteredData = () => {
      const rawData = testDbRegistry.mocks[currentTable];
      if (rawData === undefined || rawData === null) {
        return null;
      }
      
      // If the registered mock is a number or basic primitive, return it directly
      if (typeof rawData !== 'object') {
        return rawData;
      }

      // If it has explicit data/error wrapper (for forcing DB errors in tests)
      let data = rawData.data !== undefined ? rawData.data : rawData;
      if (Array.isArray(data)) {
        let filtered = [...data];
        for (const filter of appliedFilters) {
          filtered = filtered.filter(item => {
            if (item && typeof item === 'object') {
              const val = item[filter.column];
              if (filter.operator === 'gte') return val >= filter.value;
              if (filter.operator === 'lte') return val <= filter.value;
              if (filter.operator === 'gt') return val > filter.value;
              if (filter.operator === 'lt') return val < filter.value;
              return val == filter.value;
            }
            return true;
          });
        }
        return filtered;
      } else if (data && typeof data === 'object') {
        let match = true;
        for (const filter of appliedFilters) {
          if (data[filter.column] !== undefined && data[filter.column] != filter.value) {
            match = false;
            break;
          }
        }
        return match ? data : null;
      }
      
      return data;
    };

    const getError = () => {
      const rawData = testDbRegistry.mocks[currentTable];
      if (rawData && rawData.error !== undefined) {
        return rawData.error;
      }
      return null;
    };

    const chain: any = {
      from: vi.fn((table: string) => {
        currentTable = table;
        appliedFilters = [];
        return chain;
      }),
      rpc: vi.fn(async (fnName: string, args: any) => {
        const mockResult = testDbRegistry.mocks[`rpc:${fnName}`];
        if (mockResult && mockResult.data !== undefined) {
          return { data: mockResult.data, error: mockResult.error };
        }
        return { data: mockResult ?? null, error: null };
      }),
      select: vi.fn(() => chain),
      insert: vi.fn((payload: any) => {
        const data = {
          id: '47d7dfca-8857-48f8-b3ab-5c30fbdb7bb9',
          ...payload,
        };
        // Set dynamic return data
        testDbRegistry.mocks[currentTable] = data;
        return chain;
      }),
      update: vi.fn((payload: any) => {
        const existing = testDbRegistry.mocks[currentTable];
        if (existing) {
          if (Array.isArray(existing)) {
            testDbRegistry.mocks[currentTable] = existing.map(e => ({ ...e, ...payload }));
          } else {
            testDbRegistry.mocks[currentTable] = { ...existing, ...payload };
          }
        } else {
          testDbRegistry.mocks[currentTable] = payload;
        }
        return chain;
      }),
      delete: vi.fn(() => chain),
      eq: vi.fn((column: string, value: any) => {
        appliedFilters.push({ column, value });
        return chain;
      }),
      gte: vi.fn((column: string, value: any) => {
        appliedFilters.push({ column, value, operator: 'gte' });
        return chain;
      }),
      lte: vi.fn((column: string, value: any) => {
        appliedFilters.push({ column, value, operator: 'lte' });
        return chain;
      }),
      gt: vi.fn((column: string, value: any) => {
        appliedFilters.push({ column, value, operator: 'gt' });
        return chain;
      }),
      lt: vi.fn((column: string, value: any) => {
        appliedFilters.push({ column, value, operator: 'lt' });
        return chain;
      }),
      neq: vi.fn((column: string, value: any) => {
        return chain;
      }),
      in: vi.fn((column: string, values: any[]) => {
        return chain;
      }),
      is: vi.fn((column: string, value: any) => {
        return chain;
      }),
      or: vi.fn((filters: string) => {
        return chain;
      }),
      order: vi.fn(() => chain),
      range: vi.fn(() => chain),
      limit: vi.fn(() => chain),
      maybeSingle: vi.fn(async () => {
        const data = getFilteredData();
        const error = getError();
        const singleData = Array.isArray(data) ? (data.length > 0 ? data[0] : null) : data;
        return { data: singleData, error };
      }),
      single: vi.fn(async () => {
        const data = getFilteredData();
        const error = getError();
        const singleData = Array.isArray(data) ? (data.length > 0 ? data[0] : null) : data;
        return { data: singleData, error };
      }),
      then: vi.fn((resolve: any) => {
        const data = getFilteredData();
        const error = getError();
        const rawData = testDbRegistry.mocks[currentTable];
        const count = rawData && rawData.count !== undefined ? rawData.count : null;
        
        let resultList = Array.isArray(data) ? data : data ? [data] : [];
        if (typeof data === 'number') {
          // If mock is just a number (e.g. for head count)
          resultList = [];
        }
        
        return Promise.resolve(resolve({
          data: resultList,
          error,
          count: count ?? (typeof data === 'number' ? data : resultList.length),
        }));
      }),
    };
    return chain;
  };

  const mockSupabase = createMockChain();
  const mockSupabaseAnon = createMockChain();

  const storageMock = {
    from: vi.fn(() => ({
      getPublicUrl: vi.fn((path: string) => ({ data: { publicUrl: `https://mock.supabase.co/storage/v1/object/public/${path}` } })),
      createSignedUploadUrl: vi.fn(async (path: string) => ({ data: { signedUrl: `https://mock.supabase.co/upload/${path}`, token: 'mock-token' }, error: null })),
    }))
  };
  mockSupabase.storage = storageMock;
  mockSupabaseAnon.storage = storageMock;

  // Add auth specific functions
  mockSupabaseAnon.auth = {
    signUp: vi.fn(async (payload: any) => {
      const email = payload?.email;
      const profiles = testDbRegistry.mocks['profiles']?.data || testDbRegistry.mocks['profiles'];
      const profileList = Array.isArray(profiles) ? profiles : profiles ? [profiles] : [];
      const found = profileList.find(p => p.email === email);
      const id = found ? found.id : '47d7dfca-8857-48f8-b3ab-5c30fbdb7ba1';
      return { data: { user: { id, email } }, error: null };
    }),
    signInWithPassword: vi.fn(async (payload: any) => {
      const email = payload?.email;
      const profiles = testDbRegistry.mocks['profiles']?.data || testDbRegistry.mocks['profiles'];
      const profileList = Array.isArray(profiles) ? profiles : profiles ? [profiles] : [];
      const found = profileList.find(p => p.email === email);
      const id = found ? found.id : '47d7dfca-8857-48f8-b3ab-5c30fbdb7ba1';
      return {
        data: {
          session: { access_token: 'test-token', expires_at: Math.floor(Date.now() / 1000) + 3600 },
          user: { id, email }
        },
        error: null
      };
    }),
    signOut: vi.fn(async () => ({ error: null })),
    resetPasswordForEmail: vi.fn(async () => ({ data: {}, error: null })),
    admin: {
      createUser: vi.fn(async (payload: any) => {
        const email = payload?.email;
        const profiles = testDbRegistry.mocks['profiles']?.data || testDbRegistry.mocks['profiles'];
        const profileList = Array.isArray(profiles) ? profiles : profiles ? [profiles] : [];
        const found = profileList.find(p => p.email === email);
        const id = found ? found.id : '47d7dfca-8857-48f8-b3ab-5c30fbdb7ba1';
        return { data: { user: { id, email } }, error: null };
      }),
      deleteUser: vi.fn(async () => ({ error: null })),
    }
  };

  mockSupabase.auth = {
    getUser: vi.fn(async (token?: string) => {
      // Decode simulated user ID from token or default
      const id = token && token.length === 36 ? token : '47d7dfca-8857-48f8-b3ab-5c30fbdb7ba1';
      return { data: { user: { id, email: 'test@example.com' } }, error: null };
    }),
    admin: {
      createUser: vi.fn(async (payload: any) => {
        const email = payload?.email;
        const profiles = testDbRegistry.mocks['profiles']?.data || testDbRegistry.mocks['profiles'];
        const profileList = Array.isArray(profiles) ? profiles : profiles ? [profiles] : [];
        const found = profileList.find(p => p.email === email);
        const id = found ? found.id : '47d7dfca-8857-48f8-b3ab-5c30fbdb7ba1';
        return { data: { user: { id, email } }, error: null };
      }),
      deleteUser: vi.fn(async () => ({ error: null })),
    }
  };

  return {
    supabase: mockSupabase,
    supabaseAnon: mockSupabaseAnon,
  };
});

vi.mock('@/config/razorpay', () => {
  return {
    razorpay: {
      subscriptions: {
        create: vi.fn(async () => ({ id: 'sub_test_123', status: 'created' })),
        fetch: vi.fn(async () => ({ id: 'sub_test_123', status: 'authenticated' })),
      },
      payments: {
        fetch: vi.fn(async () => ({ id: 'pay_test_123', status: 'captured', amount: 1000 })),
      },
    },
  };
});
