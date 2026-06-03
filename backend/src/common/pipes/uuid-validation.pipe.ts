import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

/**
 * Regex para UUID-like (formato válido mas não necessariamente UUID spec)
 * Aceita: UUIDs padrão e IDs de seed como b0000000-0000-0000-0000-000000000006
 */
const UUID_LIKE_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Pipe para validação de UUIDs
 * Previne queries com IDs malformados
 */
@Injectable()
export class UUIDValidationPipe implements PipeTransform {
  transform(value: string) {
    if (!value) {
      throw new BadRequestException('ID is required');
    }

    if (!UUID_LIKE_REGEX.test(value)) {
      throw new BadRequestException('Invalid ID format');
    }

    return value;
  }
}
