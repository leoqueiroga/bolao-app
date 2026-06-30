import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateChampionDto, UpdateChampionDto } from './dto';

export interface Champion {
  id: string;
  title: string;
  image_url: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/** Champion com URL assinada temporária para o frontend */
export interface ChampionWithSignedUrl extends Omit<Champion, 'image_url'> {
  image_url: string; // signed URL temporária
  image_path: string; // path original no storage (para admin)
}

@Injectable()
export class ChampionsService {
  private readonly BUCKET_NAME = 'champions';
  private readonly SIGNED_URL_EXPIRY = 3600; // 1 hora em segundos

  constructor(private supabaseService: SupabaseService) {}

  async findAll(): Promise<ChampionWithSignedUrl[]> {
    const supabase = this.supabaseService.getAdminClient();

    const { data, error } = await supabase
      .from('champions')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) {
      throw new BadRequestException(error.message);
    }

    return this.attachSignedUrls(data);
  }

  async findActive(): Promise<ChampionWithSignedUrl[]> {
    const supabase = this.supabaseService.getAdminClient();

    const { data, error } = await supabase
      .from('champions')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) {
      throw new BadRequestException(error.message);
    }

    return this.attachSignedUrls(data);
  }

  async findOne(id: string): Promise<Champion> {
    const supabase = this.supabaseService.getAdminClient();

    const { data, error } = await supabase
      .from('champions')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new NotFoundException('Champion not found');
    }

    return data;
  }

  async create(
    createChampionDto: CreateChampionDto,
    file: Express.Multer.File,
  ): Promise<ChampionWithSignedUrl> {
    const supabase = this.supabaseService.getAdminClient();

    // Upload image to Supabase Storage (bucket privado)
    const imagePath = await this.uploadImage(file);

    const { data, error } = await supabase
      .from('champions')
      .insert({
        title: createChampionDto.title,
        image_url: imagePath, // armazena o path, não a URL pública
        display_order: createChampionDto.display_order || 0,
        is_active: createChampionDto.is_active ?? true,
      })
      .select()
      .single();

    if (error) {
      throw new BadRequestException(error.message);
    }

    const [withUrl] = await this.attachSignedUrls([data]);
    return withUrl;
  }

  async update(
    id: string,
    updateChampionDto: UpdateChampionDto,
    file?: Express.Multer.File,
  ): Promise<ChampionWithSignedUrl> {
    const supabase = this.supabaseService.getAdminClient();

    const updateData: Record<string, any> = {
      ...updateChampionDto,
      updated_at: new Date().toISOString(),
    };

    // If a new image is provided, upload it and delete the old one
    if (file) {
      const existing = await this.findOne(id);
      const newPath = await this.uploadImage(file);
      await this.deleteImageFromStorage(existing.image_url);
      updateData.image_url = newPath;
    }

    const { data, error } = await supabase
      .from('champions')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new BadRequestException(error.message);
    }

    const [withUrl] = await this.attachSignedUrls([data]);
    return withUrl;
  }

  async remove(id: string): Promise<void> {
    const supabase = this.supabaseService.getAdminClient();

    // Delete image from storage first
    const existing = await this.findOne(id);
    await this.deleteImageFromStorage(existing.image_url);

    const { error } = await supabase.from('champions').delete().eq('id', id);

    if (error) {
      throw new BadRequestException(error.message);
    }
  }

  /**
   * Faz upload da imagem para o bucket privado e retorna o path relativo.
   */
  private async uploadImage(file: Express.Multer.File): Promise<string> {
    const supabase = this.supabaseService.getAdminClient();

    const fileExt = file.originalname.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `gallery/${fileName}`;

    const { error } = await supabase.storage
      .from(this.BUCKET_NAME)
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (error) {
      throw new BadRequestException(`Image upload failed: ${error.message}`);
    }

    // Retorna apenas o path, não a URL pública
    return filePath;
  }

  /**
   * Gera signed URLs temporárias para uma lista de campeões.
   */
  private async attachSignedUrls(
    champions: Champion[],
  ): Promise<ChampionWithSignedUrl[]> {
    if (champions.length === 0) return [];

    const supabase = this.supabaseService.getAdminClient();

    const paths = champions.map((c) => c.image_url);

    const { data: signedUrls, error } = await supabase.storage
      .from(this.BUCKET_NAME)
      .createSignedUrls(paths, this.SIGNED_URL_EXPIRY);

    if (error) {
      throw new BadRequestException(
        `Failed to generate signed URLs: ${error.message}`,
      );
    }

    return champions.map((champion, index) => ({
      ...champion,
      image_path: champion.image_url,
      image_url: signedUrls[index]?.signedUrl || '',
    }));
  }

  /**
   * Remove imagem do storage usando o path relativo armazenado no banco.
   */
  private async deleteImageFromStorage(imagePath: string): Promise<void> {
    const supabase = this.supabaseService.getAdminClient();

    try {
      await supabase.storage.from(this.BUCKET_NAME).remove([imagePath]);
    } catch {
      // Silently fail if image deletion fails (image might already be removed)
    }
  }
}
