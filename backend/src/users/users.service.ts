import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class UsersService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async findAll() {
    const supabase = this.supabaseService.getAdminClient();

    const { data: users, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Erro ao buscar usuários: ${error.message}`);
    }

    return users;
  }

  async updateRole(userId: string, role: string) {
    const supabase = this.supabaseService.getAdminClient();

    // Verificar se o usuário existe
    const { data: user, error: findError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (findError || !user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    // Atualizar role
    const { data: updatedUser, error: updateError } = await supabase
      .from('profiles')
      .update({ role })
      .eq('id', userId)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Erro ao atualizar role: ${updateError.message}`);
    }

    return updatedUser;
  }
}
