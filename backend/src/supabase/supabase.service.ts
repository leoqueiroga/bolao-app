import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_CLIENT_OPTIONS = {
  global: {
    fetch: (url: RequestInfo | URL, options?: RequestInit) =>
      fetch(url, { ...options, signal: AbortSignal.timeout(8000) }),
  },
};

// Timeout maior para operações admin/scheduler que podem demorar mais
const SUPABASE_ADMIN_CLIENT_OPTIONS = {
  global: {
    fetch: (url: RequestInfo | URL, options?: RequestInit) =>
      fetch(url, { ...options, signal: AbortSignal.timeout(30000) }),
  },
};

@Injectable()
export class SupabaseService {
  private supabase: SupabaseClient;
  private supabaseAdmin: SupabaseClient;

  constructor(private configService: ConfigService) {
    this.supabase = createClient(
      this.configService.getOrThrow<string>('SUPABASE_URL'),
      this.configService.getOrThrow<string>('SUPABASE_ANON_KEY'),
      SUPABASE_CLIENT_OPTIONS,
    );

    this.supabaseAdmin = createClient(
      this.configService.getOrThrow<string>('SUPABASE_URL'),
      this.configService.getOrThrow<string>('SUPABASE_SERVICE_ROLE_KEY'),
      SUPABASE_ADMIN_CLIENT_OPTIONS,
    );
  }

  getClient(): SupabaseClient {
    return this.supabase;
  }

  getAdminClient(): SupabaseClient {
    return this.supabaseAdmin;
  }

  getDatabaseClientWithToken(token: string): SupabaseClient {
    return createClient(
      this.configService.getOrThrow<string>('SUPABASE_URL'),
      this.configService.getOrThrow<string>('SUPABASE_ANON_KEY'),
      {
        accessToken: async () => token,
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
        global: {
          fetch: (url: RequestInfo | URL, options?: RequestInit) =>
            fetch(url, { ...options, signal: AbortSignal.timeout(8000) }),
        },
      },
    );
  }

  getClientWithToken(token: string): SupabaseClient {
    return createClient(
      this.configService.getOrThrow<string>('SUPABASE_URL'),
      this.configService.getOrThrow<string>('SUPABASE_ANON_KEY'),
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          fetch: (url: RequestInfo | URL, options?: RequestInit) =>
            fetch(url, { ...options, signal: AbortSignal.timeout(8000) }),
        },
      },
    );
  }
}
