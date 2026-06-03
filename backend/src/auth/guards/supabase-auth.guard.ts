import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SupabaseClient, User } from '@supabase/supabase-js';
import { SupabaseService } from '../../supabase/supabase.service';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private supabaseService: SupabaseService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token não fornecido');
    }

    const token = authHeader.replace('Bearer ', '');

    try {
      const supabaseClient = this.supabaseService.getClient();
      const {
        data: { user },
        error,
      } = await supabaseClient.auth.getUser(token);

      if (error || !user) {
        throw new UnauthorizedException('Token inválido');
      }

      const userDatabaseClient =
        this.supabaseService.getDatabaseClientWithToken(token);
      const profile = await this.findProfile(user, userDatabaseClient);

      if (!profile) {
        console.warn(
          'Authenticated user profile unavailable, continuing with basic user:',
          JSON.stringify({ userId: user.id, email: user.email }),
        );

        request.user = {
          id: user.id,
          email: user.email,
          role: 'user',
          profile_unavailable: true,
        };

        return true;
      }

      request.user = {
        ...profile,
        id: user.id,
        email: user.email,
        profile_id: profile.id,
      };

      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Erro na autenticação');
    }
  }

  private async findProfile(user: User, userClient: SupabaseClient) {
    const adminClient = this.supabaseService.getAdminClient();

    // Tenta em paralelo: se uma conexão/role estiver lenta, a outra pode responder.
    // Como auth.users.id e profiles.id já são iguais, a busca por id é suficiente.
    return this.findFirstSuccessfulProfile([
      this.findProfileById(userClient, user, 'authenticated'),
      this.findProfileById(adminClient, user, 'admin'),
    ]);
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
