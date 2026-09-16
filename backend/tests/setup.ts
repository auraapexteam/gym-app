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
  const createTableQuery = (table: string, client?: any) => {
    let appliedFilters: Array<{ column: string; value: any; operator?: string }> = [];

    const getFilteredData = () => {
      const rawData = testDbRegistry.mocks[table];
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
      const rawData = testDbRegistry.mocks[table];
      if (rawData && rawData.error !== undefined) {
        return rawData.error;
      }
      return null;
    };

    const query: any = {
      select: vi.fn((...args: any[]) => { if (client?.select) client.select(...args); return query; }),
      insert: vi.fn((payload: any) => {
        if (client?.insert) client.insert(payload);
        const data = {
          id: '47d7dfca-8857-48f8-b3ab-5c30fbdb7bb9',
          ...payload,
        };
        testDbRegistry.mocks[table] = data;
        return query;
      }),
      upsert: vi.fn((payload: any) => {
        if (client?.upsert) client.upsert(payload);
        const data = {
          id: '47d7dfca-8857-48f8-b3ab-5c30fbdb7bb9',
          ...(Array.isArray(payload) ? payload[0] : payload),
        };
        testDbRegistry.mocks[table] = data;
        return query;
      }),
      update: vi.fn((payload: any) => {
        if (client?.update) {
          const custom = client.update(payload);
          if (custom && custom !== client) return custom;
        }
        const existing = testDbRegistry.mocks[table];
        if (existing) {
          if (Array.isArray(existing)) {
            testDbRegistry.mocks[table] = existing.map(e => ({ ...e, ...payload }));
          } else {
            testDbRegistry.mocks[table] = { ...existing, ...payload };
          }
        } else {
          testDbRegistry.mocks[table] = payload;
        }
        return query;
      }),
      delete: vi.fn((...args: any[]) => { if (client?.delete) client.delete(...args); return query; }),
      eq: vi.fn((column: string, value: any) => {
        if (client?.eq) client.eq(column, value);
        appliedFilters.push({ column, value, operator: 'eq' });
        return query;
      }),
      gte: vi.fn((column: string, value: any) => {
        if (client?.gte) client.gte(column, value);
        appliedFilters.push({ column, value, operator: 'gte' });
        return query;
      }),
      lte: vi.fn((column: string, value: any) => {
        if (client?.lte) client.lte(column, value);
        appliedFilters.push({ column, value, operator: 'lte' });
        return query;
      }),
      gt: vi.fn((column: string, value: any) => {
        if (client?.gt) client.gt(column, value);
        appliedFilters.push({ column, value, operator: 'gt' });
        return query;
      }),
      lt: vi.fn((column: string, value: any) => {
        if (client?.lt) client.lt(column, value);
        appliedFilters.push({ column, value, operator: 'lt' });
        return query;
      }),
      neq: vi.fn((column: string, value: any) => {
        if (client?.neq) client.neq(column, value);
        return query;
      }),
      in: vi.fn((column: string, values: any[]) => {
        if (client?.in) client.in(column, values);
        return query;
      }),
      is: vi.fn((column: string, value: any) => {
        if (client?.is) client.is(column, value);
        return query;
      }),
      or: vi.fn((filters: string) => {
        if (client?.or) client.or(filters);
        return query;
      }),
      order: vi.fn((...args: any[]) => { if (client?.order) client.order(...args); return query; }),
      range: vi.fn((...args: any[]) => { if (client?.range) client.range(...args); return query; }),
      limit: vi.fn((...args: any[]) => { if (client?.limit) client.limit(...args); return query; }),
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
        const rawData = testDbRegistry.mocks[table];
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

    return query;
  };

  const createMockChain = () => {
    const client: any = {
      from: vi.fn((table: string) => createTableQuery(table, client)),
      rpc: vi.fn(async (fnName: string, args: any) => {
        const mockResult = testDbRegistry.mocks[`rpc:${fnName}`];
        if (mockResult && mockResult.data !== undefined) {
          return { data: mockResult.data, error: mockResult.error };
        }
        return { data: mockResult ?? null, error: null };
      }),
      select: vi.fn(() => client),
      insert: vi.fn(() => client),
      upsert: vi.fn(() => client),
      update: vi.fn(() => client),
      delete: vi.fn(() => client),
      eq: vi.fn(() => client),
      gte: vi.fn(() => client),
      lte: vi.fn(() => client),
      gt: vi.fn(() => client),
      lt: vi.fn(() => client),
      neq: vi.fn(() => client),
      in: vi.fn(() => client),
      is: vi.fn(() => client),
      or: vi.fn(() => client),
      order: vi.fn(() => client),
      range: vi.fn(() => client),
      limit: vi.fn(() => client),
      single: vi.fn(() => client),
      maybeSingle: vi.fn(() => client),
    };
    return client;
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
    signInWithOtp: vi.fn(async (_payload: any) => {
      if (testDbRegistry.mocks['otp:error']) {
        return { data: {}, error: testDbRegistry.mocks['otp:error'] };
      }
      return { data: {}, error: null };
    }),
    verifyOtp: vi.fn(async (payload: any) => {
      if (testDbRegistry.mocks['otp:verifyError'] || payload?.token === '000000') {
        return { data: { session: null, user: null }, error: { message: 'Invalid OTP code' } };
      }
      const phone = payload?.phone || '+919876543210';
      const id = '47d7dfca-8857-48f8-b3ab-5c30fbdb7ba7';
      return {
        data: {
          session: { access_token: 'test-otp-token', expires_at: Math.floor(Date.now() / 1000) + 3600 },
          user: { id, phone, email: `${phone.replace(/[^0-9]/g, '')}@phone.auraapex.internal`, user_metadata: { full_name: 'OTP User' } },
        },
        error: null,
      };
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
