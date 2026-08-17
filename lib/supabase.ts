import { createBrowserClient } from '@supabase/ssr';
import { mockAuthClient } from './mock-auth';

const useMockAuth = process.env.NEXT_PUBLIC_MOCK_AUTH === 'true';

// Mock Supabase client for testing without backend
class MockSupabaseClient {
  auth = {
    signUp: async ({ email, password }: { email: string; password: string }) => {
      return mockAuthClient.signUp(email, password);
    },
    signInWithPassword: async ({ email, password }: { email: string; password: string }) => {
      return mockAuthClient.signInWithPassword(email, password);
    },
    getUser: async () => {
      return mockAuthClient.getUser();
    },
    signOut: async () => {
      return mockAuthClient.signOut();
    },
  };

  from(table: string) {
    return {
      select: () => ({
        eq: () => ({
          order: () => ({
            then: (cb: any) => cb({ data: [], error: null }),
          }),
        }),
        gte: () => ({
          lte: () => ({
            order: () => ({
              then: (cb: any) => cb({ data: [], error: null }),
            }),
          }),
        }),
      }),
      insert: async (data: any) => ({ data: null, error: null }),
      delete: async () => ({ error: null }),
    };
  }
}

export function createClient() {
  if (useMockAuth) {
    return new MockSupabaseClient() as any;
  }

  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
