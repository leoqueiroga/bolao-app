import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

type ErrorLogPayload = {
  status: number;
  method: string;
  path: string;
  message: string;
  response?: unknown;
};

/**
 * Filtro global de exceções
 * Evita exposição de informações sensíveis em produção
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.message
        : exception instanceof Error
          ? exception.message
          : 'Internal server error';

    const exceptionResponse =
      exception instanceof HttpException ? exception.getResponse() : undefined;

    // Log erro completo internamente (apenas em desenvolvimento)
    if (process.env.NODE_ENV !== 'production') {
      console.error('Exception:', {
        path: request.url,
        method: request.method,
        error: exception,
      });
    } else {
      // Em produção, não expor detalhes ao cliente, mas manter detalhes no log interno
      const logPayload: ErrorLogPayload = {
        status,
        method: request.method,
        path: request.url,
        message,
      };

      if (exceptionResponse) {
        logPayload.response = exceptionResponse;
      }

      console.error('HTTP Exception:', JSON.stringify(logPayload));
    }

    // Retornar mensagem sanitizada
    response.status(status).json({
      statusCode: status,
      message:
        process.env.NODE_ENV === 'production'
          ? this.sanitizeMessage(message, status)
          : message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }

  private sanitizeMessage(message: string, status: number): string {
    // Erros de servidor - sempre mensagem genérica
    if (status >= 500) return 'Internal server error';

    // Erros de autenticação - mensagem genérica
    if (status === 401) return 'Unauthorized';
    if (status === 403) return 'Forbidden';
    if (status === 404) return 'Resource not found';

    // Erros de validação podem passar (4xx)
    if (status === 400 || status === 422) {
      // Remover detalhes técnicos do Supabase
      if (message.includes('duplicate key') || message.includes('violates')) {
        return 'Validation error';
      }
    }

    return message;
  }
}
