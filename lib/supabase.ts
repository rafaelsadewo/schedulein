import { createBrowserClient } from '@supabase/ssr';
import { mockAuthClient } from './mock-auth';

const useMockAuth = process.env.NEXT_PUBLIC_MOCK_AUTH === 'true';

type Row = Record<string, any>;

function readTable(table: string): Row[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(`mock-db-${table}`);
  return raw ? JSON.parse(raw) : [];
}

function writeTable(table: string, rows: Row[]) {
  localStorage.setItem(`mock-db-${table}`, JSON.stringify(rows));
}

// Chainable, thenable query builder mimicking the subset of supabase-js used in this app.
class MockQueryBuilder implements PromiseLike<{ data: Row[]; error: null }> {
  private filters: Array<(row: Row) => boolean> = [];
  private orderField: string | null = null;
  private orderAsc = true;

  constructor(private table: string, private mode: 'select' | 'delete') {}

  eq(field: string, value: any) {
    this.filters.push((row) => row[field] === value);
    return this;
  }

  gte(field: string, value: any) {
    this.filters.push((row) => row[field] >= value);
    return this;
  }

  lte(field: string, value: any) {
    this.filters.push((row) => row[field] <= value);
    return this;
  }

  in(field: string, values: any[]) {
    this.filters.push((row) => values.includes(row[field]));
    return this;
  }

  order(field: string, opts?: { ascending?: boolean }) {
    this.orderField = field;
    this.orderAsc = opts?.ascending !== false;
    return this;
  }

  private run(): { data: Row[]; error: null } {
    const rows = readTable(this.table);
    const matches = (row: Row) => this.filters.every((f) => f(row));

    if (this.mode === 'delete') {
      writeTable(this.table, rows.filter((r) => !matches(r)));
      return { data: rows.filter(matches), error: null };
    }

    let result = rows.filter(matches);
    if (this.orderField) {
      const field = this.orderField;
      result = [...result].sort((a, b) => {
        if (a[field] < b[field]) return this.orderAsc ? -1 : 1;
        if (a[field] > b[field]) return this.orderAsc ? 1 : -1;
        return 0;
      });
    }
    return { data: result, error: null };
  }

  then<TResult1 = { data: Row[]; error: null }, TResult2 = never>(
    onfulfilled?: ((value: { data: Row[]; error: null }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ): PromiseLike<TResult1 | TResult2> {
    return Promise.resolve(this.run()).then(onfulfilled, onrejected);
  }
}

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
      select: (_cols?: string) => new MockQueryBuilder(table, 'select'),
      insert: async (data: Row[]) => {
        const rows = readTable(table);
        const inserted = data.map((row) => ({
          id: `${table}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          created_at: new Date().toISOString(),
          ...row,
        }));
        writeTable(table, [...rows, ...inserted]);
        return { data: inserted, error: null };
      },
      delete: () => new MockQueryBuilder(table, 'delete'),
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
