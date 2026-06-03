import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { SupabaseClient, User } from '@supabase/supabase-js';
import { SupabaseService } from '../supabase/supabase.service';
import { LoginDto, RegisterDto } from './dto';

@Injectable()
export class AuthService {
  constructor(private supabaseService: SupabaseService) {}

  async register(registerDto: RegisterDto) {
    const supabase = this.supabaseService.getClient();

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: registerDto.email,
      password: registerDto.password,
      options: {
        data: {
          name: registerDto.name,
        },
      },
    });

    if (authError) {
      throw new BadRequestException(authError.message);
    }

    if (!authData.user) {
      throw new BadRequestException('Failed to create user');
    }

    // Create profile in profiles table
    const supabaseAdmin = this.supabaseService.getAdminClient();
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: authData.user.id,
        name: registerDto.name,
        email: registerDto.email,
        role: 'user',
        is_active: true,
        level: 1,
        experience_points: 0,
        current_streak: 0,
        best_streak: 0,
      });

    if (profileError) {
      console.error('Profile creation error:', profileError);
    }

    return {
      user: {
        id: authData.user.id,
        email: authData.user.email,
        name: registerDto.name,
      },
      session: authData.session,
    };
  }

  async login(loginDto: LoginDto) {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email: loginDto.email,
      password: loginDto.password,
    });

    if (error) {
      throw new UnauthorizedException(error.message);
    }

    const authenticatedClient = this.supabaseService.getDatabaseClientWithToken(
      data.session.access_token,
    );
    const profile = await this.findProfile(data.user, authenticatedClient);

    return {
      user: {
        id: data.user.id,
        email: data.user.email,
        role: profile?.role ?? 'user',
        profile_unavailable: !profile,
        ...profile,
        profile_id: profile?.id,
      },
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at,
      },
    };
  }

  async logout(accessToken: string) {
    const supabase = this.supabaseService.getClientWithToken(accessToken);

    const { error } = await supabase.auth.signOut();

    if (error) {
      throw new BadRequestException(error.message);
    }

    return { message: 'Logged out successfully' };
  }

  async getProfile(userId: string, email?: string) {
    const supabaseAdmin = this.supabaseService.getAdminClient();

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (profile) {
      return profile;
    }

    if (email) {
      const { data: profileByEmail } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('email', email)
        .maybeSingle();

      if (profileByEmail) {
        return profileByEmail;
      }
    }

    console.error(
      'Profile not found:',
      JSON.stringify({ userId, email: email ?? null }),
    );

    throw new BadRequestException('Profile not found');
  }

  async refreshToken(refreshToken: string) {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (error) {
      throw new UnauthorizedException(error.message);
    }

    return {
      access_token: data.session?.access_token,
      refresh_token: data.session?.refresh_token,
      expires_at: data.session?.expires_at,
    };
  }

  private async findProfile(user: User, userClient?: SupabaseClient) {
    const supabaseAdmin = this.supabaseService.getAdminClient();
    const profileLookups = [this.findProfileById(supabaseAdmin, user, 'admin')];

    if (userClient) {
      profileLookups.unshift(
        this.findProfileById(userClient, user, 'authenticated'),
      );
    }

    return this.findFirstSuccessfulProfile(profileLookups);
  }

  private async findFirstSuccessfulProfile(profileLookups: Promise<any>[]) {
    try {
      return await Promise.any(profileLookups);
    } catch {
      return null;
    }
  }

  private async findProfileById(
    client: SupabaseClient,
    user: User,
    clientName: string,
  ) {
    const { data: profileById, error: profileByIdError } = await client
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (profileByIdError) {
      console.error(
        'Profile lookup by id failed:',
        JSON.stringify({
          client: clientName,
          userId: user.id,
          email: user.email,
          error: profileByIdError.message,
          code: profileByIdError.code,
        }),
      );
    }

    if (profileById) {
      return profileById;
    }

    throw new Error(`Profile not found using ${clientName} client`);
  }
}
