// Mock Auth - for testing without Supabase backend

interface MockUser {
  id: string;
  email: string;
}

interface MockSession {
  user: MockUser;
}

interface MockAuthResponse {
  data: { user: MockUser | null };
  error: { message: string } | null;
}

class MockAuthClient {
  private users: Map<string, { email: string; password: string; id: string }> = new Map();

  constructor() {
    // Pre-populate some test users
    this.users.set('test@example.com', {
      email: 'test@example.com',
      password: 'password123',
      id: 'mock-user-1',
    });
  }

  async signUp(email: string, password: string): Promise<MockAuthResponse> {
    await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate network delay

    if (this.users.has(email)) {
      return {
        data: { user: null },
        error: { message: 'Email already registered' },
      };
    }

    const userId = `mock-user-${Date.now()}`;
    this.users.set(email, { email, password, id: userId });

    // Store in localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('mock-session', JSON.stringify({ user: { id: userId, email } }));
      localStorage.setItem('mock-user-id', userId);
    }

    return {
      data: { user: { id: userId, email } },
      error: null,
    };
  }

  async signInWithPassword(email: string, password: string): Promise<MockAuthResponse> {
    await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate network delay

    const user = this.users.get(email);

    if (!user || user.password !== password) {
      return {
        data: { user: null },
        error: { message: 'Invalid email or password' },
      };
    }

    // Store in localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('mock-session', JSON.stringify({ user: { id: user.id, email } }));
      localStorage.setItem('mock-user-id', user.id);
    }

    return {
      data: { user: { id: user.id, email } },
      error: null,
    };
  }

  async getUser(): Promise<MockAuthResponse> {
    if (typeof window === 'undefined') {
      return { data: { user: null }, error: null };
    }

    const session = localStorage.getItem('mock-session');
    if (session) {
      try {
        const parsed = JSON.parse(session);
        return { data: { user: parsed.user }, error: null };
      } catch {
        return { data: { user: null }, error: null };
      }
    }

    return { data: { user: null }, error: null };
  }

  async signOut(): Promise<{ error: null }> {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('mock-session');
      localStorage.removeItem('mock-user-id');
    }
    return { error: null };
  }

  // Mock mode has no real email delivery - just confirm the account exists.
  async resetPasswordForEmail(email: string): Promise<{ error: { message: string } | null }> {
    await new Promise((resolve) => setTimeout(resolve, 300));
    if (!this.users.has(email)) {
      return { error: { message: 'No account found with that email' } };
    }
    return { error: null };
  }

  async updateUser(password: string): Promise<{ error: { message: string } | null }> {
    if (typeof window === 'undefined') return { error: { message: 'Not signed in' } };
    const session = localStorage.getItem('mock-session');
    if (!session) return { error: { message: 'Not signed in' } };
    const { user } = JSON.parse(session);
    const existing = this.users.get(user.email);
    if (!existing) return { error: { message: 'Not signed in' } };
    this.users.set(user.email, { ...existing, password });
    return { error: null };
  }
}

export const mockAuthClient = new MockAuthClient();
