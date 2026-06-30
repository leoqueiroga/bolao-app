import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { SupabaseService } from '../supabase/supabase.service';
import { SchedulerService } from '../scheduler/scheduler.service';
import { FootballDataClient, FootballDataApiError } from './football-data.client';
import { PollingJob } from './interfaces/polling-job.interface';
import { FootballDataStatus } from './interfaces/football-data.interfaces';

const MATCH_DURATION_MS = 90 * 60 * 1000; // 90 minutes in milliseconds
const MAX_FAIRNESS_INTERVAL_MS = 4 * 60 * 1000; // 4 minutes max between polls
const PRIORITY_THRESHOLD = 5; // Only apply priority ordering when >5 matches
const CAPACITY_SATURATION_THRESHOLD = 40; // Log alert when exceeding this
const SAFETY_TIMEOUT_MS = 180 * 60 * 1000; // 180 minutes beyond Match_End_Window
const POLL_INTERVAL_IN_PLAY_MS = 2 * 60 * 1000; // 2 minutes
const POLL_INTERVAL_PENALTY_MS = 60_000; // 1 minute for penalty shootout
const POLL_INTERVAL_ERROR_MS = 1 * 60 * 1000; // 1 minute
const MAX_CONSECUTIVE_ERRORS = 5;
const MAX_PENALTY_RETRIES = 10;

/** Status que indicam jogo em andamento */
const IN_PLAY_STATUSES: FootballDataStatus[] = [
  'IN_PLAY',
  'PAUSED',
  'HALFTIME',
  'EXTRA_TIME',
];

/** Status terminais que impedem finalização normal */
const TERMINAL_STATUSES: FootballDataStatus[] = [
  'POSTPONED',
  'CANCELLED',
  'SUSPENDED',
  'AWARDED',
];

/** Mapeamento de status da API para status interno do DB */
const STATUS_MAP: Partial<Record<FootballDataStatus, string>> = {
  POSTPONED: 'postponed',
  CANCELLED: 'cancelled',
  SUSPENDED: 'postponed',
  AWARDED: 'finished',
};

@Injectable()
export class MatchMonitorService implements OnModuleInit {
  private readonly logger = new Logger(MatchMonitorService.name);

  /** Map de jobs ativos indexado por gameId */
  private readonly activeJobs = new Map<string, PollingJob>();

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly schedulerService: SchedulerService,
    private readonly footballDataClient: FootballDataClient,
  ) {}

  /**
   * Lifecycle hook: recupera partidas in_progress na inicialização do módulo.
   * Agenda Polling_Jobs para todas as partidas pendentes.
   * Deve concluir em no máximo 30 segundos (Requisito 6.5).
   */
  async onModuleInit(): Promise<void> {
    const startTime = Date.now();
    this.logger.log('🔄 Iniciando recuperação de partidas in_progress...');

    const supabase = this.supabaseService.getAdminClient();

    const { data: games, error } = await supabase
      .from('games')
      .select('id, external_match_id, match_date')
      .eq('status', 'in_progress')
      .is('deleted_at', null);

    if (error) {
      this.logger.error(
        `❌ Erro ao recuperar partidas in_progress na inicialização | error=${error.message}`,
      );
      return;
    }

    if (!games || games.length === 0) {
      this.logger.log('✅ Nenhuma partida in_progress para recuperar');
      return;
    }

    let scheduled = 0;
    let skipped = 0;

    for (const game of games) {
      if (!game.external_match_id) {
        this.logger.warn(
          `⚠️ external_match_id ausente na recuperação | gameId=${game.id}`,
        );
        skipped++;
        continue;
      }

      this.schedulePolling(game.id, game.external_match_id, game.match_date);
      scheduled++;
    }

    const elapsed = Date.now() - startTime;
    this.logger.log(
      `✅ Recuperação concluída | agendados=${scheduled} ignorados=${skipped} tempo=${elapsed}ms`,
    );
  }

  /**
   * Cron job executado a cada 1 minuto.
   * Detecta novos jogos com status `in_progress` e `external_match_id` preenchido,
   * e agenda Polling_Jobs para eles.
   */
  @Cron('*/1 * * * *')
  async checkForNewInProgressGames(): Promise<void> {
    const supabase = this.supabaseService.getAdminClient();

    const { data: games, error } = await supabase
      .from('games')
      .select('id, external_match_id, match_date')
      .eq('status', 'in_progress')
      .is('deleted_at', null);

    if (error) {
      this.logger.error(
        `❌ Erro ao buscar jogos in_progress | error=${error.message}`,
      );
      return;
    }

    if (!games || games.length === 0) {
      return;
    }

    for (const game of games) {
      // Ignorar se já existe um job ativo para este jogo
      if (this.activeJobs.has(game.id)) {
        continue;
      }

      // Log warning se external_match_id está ausente
      if (!game.external_match_id) {
        this.logger.warn(
          `⚠️ external_match_id ausente | gameId=${game.id}`,
        );
        continue;
      }

      this.schedulePolling(game.id, game.external_match_id, game.match_date);
    }
  }

  /**
   * Agenda um Polling_Job para uma partida.
   * Calcula Match_End_Window (match_date + 90min) e agenda o setTimeout.
   * Se a Match_End_Window já passou, inicia imediatamente.
   * Ignora duplicatas (verifica Map por gameId).
   */
  schedulePolling(
    gameId: string,
    externalMatchId: number,
    matchDate: string,
  ): void {
    // Ignorar agendamento duplicado
    if (this.activeJobs.has(gameId)) {
      return;
    }

    const matchEndWindow = new Date(
      new Date(matchDate).getTime() + MATCH_DURATION_MS,
    );
    const now = new Date();
    const delayMs = Math.max(0, matchEndWindow.getTime() - now.getTime());

    const scheduledAt = delayMs > 0 ? matchEndWindow : now;

    const job: PollingJob = {
      gameId,
      externalMatchId,
      matchDate,
      scheduledAt,
      consecutiveErrors: 0,
      timeoutRef: null,
      lastPolledAt: null,
      lastApiStatus: null,
      penaltyRetryCount: 0,
    };

    // Agendar o timeout
    job.timeoutRef = setTimeout(() => {
      this.startPolling(gameId, externalMatchId);
    }, delayMs);

    this.activeJobs.set(gameId, job);

    // Definir is_monitoring = true no banco
    this.setMonitoringFlag(gameId, true);

    // Log do agendamento com timestamp ISO 8601
    this.logger.log(
      `⚽ Polling agendado | gameId=${gameId} externalMatchId=${externalMatchId} scheduledAt=${scheduledAt.toISOString()}`,
    );
  }

  /**
   * Inicia o polling de uma partida.
   */
  private startPolling(gameId: string, externalMatchId: number): void {
    this.logger.log(
      `🔄 Iniciando polling | gameId=${gameId} externalMatchId=${externalMatchId}`,
    );
    this.pollMatch(gameId, externalMatchId);
  }

  /**
   * Executa o polling de uma partida específica.
   * Consulta a API, trata todos os status possíveis, atualiza DB e gerencia erros.
   */
  async pollMatch(gameId: string, externalMatchId: number): Promise<void> {
    // Verificar timeout de segurança (180min além da Match_End_Window)
    const job = this.activeJobs.get(gameId);
    if (job && this.isPollingTimedOut(job)) {
      const matchEndWindow = new Date(job.matchDate).getTime() + MATCH_DURATION_MS;
      const elapsedMinutes = Math.round((Date.now() - matchEndWindow) / 60000);
      await this.stopPolling(
        gameId,
        `Timeout de segurança excedido (${elapsedMinutes}min além da Match_End_Window)`,
      );
      return;
    }

    // Atualizar lastPolledAt
    if (job) {
      job.lastPolledAt = new Date();
    }

    try {
      const match = await this.footballDataClient.getMatch(externalMatchId);
      const status = match.status;

      // Status FINISHED
      if (status === 'FINISHED') {
        const duration = match.score.duration;

        // Caminho: PENALTY_SHOOTOUT — extrair regularTime + penalties
        if (duration === 'PENALTY_SHOOTOUT') {
          const regularHome = match.score.regularTime?.home ?? null;
          const regularAway = match.score.regularTime?.away ?? null;
          const penHome = match.score.penalties?.home ?? null;
          const penAway = match.score.penalties?.away ?? null;

          // Se penalties ou regularTime são nulos: retry com limite
          if (penHome === null || penAway === null || regularHome === null || regularAway === null) {
            if (job) {
              job.penaltyRetryCount++;

              if (job.penaltyRetryCount >= MAX_PENALTY_RETRIES) {
                this.logger.error(
                  `❌ Dados de pênaltis indisponíveis após 10 tentativas | gameId=${gameId}`,
                );
                await this.stopPolling(gameId, 'Dados de pênaltis indisponíveis após 10 tentativas');
                return;
              }

              this.logger.warn(
                `⚠️ FINISHED com penalties nulos | gameId=${gameId} retryCount=${job.penaltyRetryCount}/10`,
              );
            }

            this.reschedulePolling(gameId, externalMatchId, POLL_INTERVAL_PENALTY_MS);
            return;
          }

          // Scores válidos: zerar erros, atualizar DB com regularTime + penalties
          if (job) {
            job.consecutiveErrors = 0;
            job.lastApiStatus = status;
          }

          const supabase = this.supabaseService.getAdminClient();
          const now = new Date().toISOString();

          const { error: updateError } = await supabase
            .from('games')
            .update({
              status: 'finished',
              home_score: regularHome,
              away_score: regularAway,
              penalty_home_score: penHome,
              penalty_away_score: penAway,
              updated_at: now,
            })
            .eq('id', gameId);

          if (updateError) {
            this.logger.error(
              `❌ Erro ao atualizar jogo finalizado | gameId=${gameId} error=${updateError.message}`,
            );
            this.reschedulePolling(gameId, externalMatchId, POLL_INTERVAL_ERROR_MS);
            return;
          }

          // Log de finalização com pênaltis (Req 7.4)
          this.logger.log(
            `✅ Partida finalizada (pênaltis) | gameId=${gameId} regulamentar=${regularHome}x${regularAway} penaltis=${penHome}x${penAway}`,
          );

          // Encerrar monitoramento
          await this.stopPolling(gameId, 'Partida finalizada com sucesso');

          // Calcular pontos
          try {
            await this.schedulerService.calculateGamePoints(gameId);
          } catch (calcError) {
            this.logger.error(
              `❌ Erro ao calcular pontos | gameId=${gameId} error=${calcError instanceof Error ? calcError.message : String(calcError)}`,
            );
          }

          return;
        }

        // Caminho: REGULAR, EXTRA_TIME ou null — extrair fullTime, manter penalty como null
        const homeScore = match.score.fullTime.home;
        const awayScore = match.score.fullTime.away;

        // Scores nulos apesar de FINISHED: reagendar +2min (Req 5.5)
        if (homeScore === null || awayScore === null) {
          this.logger.warn(
            `⚠️ FINISHED com scores nulos | gameId=${gameId} externalMatchId=${externalMatchId}`,
          );
          this.reschedulePolling(gameId, externalMatchId, POLL_INTERVAL_IN_PLAY_MS);
          return;
        }

        // Proteção: se regularTime existe e é diferente de fullTime, provavelmente houve prorrogação/pênaltis
        // mas duration veio null. Reagendar para esperar dados completos.
        if (match.score.regularTime && match.score.regularTime.home !== null) {
          const regHome = match.score.regularTime.home;
          const regAway = match.score.regularTime.away;
          if (regHome !== homeScore || regAway !== awayScore) {
            // fullTime diverge de regularTime — provavelmente pênaltis/prorrogação sem duration preenchido
            if (job) {
              job.penaltyRetryCount++;
              if (job.penaltyRetryCount >= MAX_PENALTY_RETRIES) {
                // Após 10 tentativas, salvar com os dados disponíveis (fullTime) como fallback
                this.logger.warn(
                  `⚠️ duration não preenchido após 10 tentativas, usando fullTime como fallback | gameId=${gameId}`,
                );
              } else {
                this.logger.warn(
                  `⚠️ FINISHED com duration=${duration} mas fullTime≠regularTime, aguardando dados completos | gameId=${gameId} retryCount=${job.penaltyRetryCount}/10`,
                );
                this.reschedulePolling(gameId, externalMatchId, POLL_INTERVAL_PENALTY_MS);
                return;
              }
            }
          }
        }

        // Scores válidos: zerar erros, atualizar DB e calcular pontos
        if (job) {
          job.consecutiveErrors = 0;
          job.lastApiStatus = status;
        }

        const supabase = this.supabaseService.getAdminClient();
        const now = new Date().toISOString();

        const { error: updateError } = await supabase
          .from('games')
          .update({
            status: 'finished',
            home_score: homeScore,
            away_score: awayScore,
            updated_at: now,
          })
          .eq('id', gameId);

        if (updateError) {
          this.logger.error(
            `❌ Erro ao atualizar jogo finalizado | gameId=${gameId} error=${updateError.message}`,
          );
          // Reagendar +1min em caso de falha no DB (Req 5.3)
          this.reschedulePolling(gameId, externalMatchId, POLL_INTERVAL_ERROR_MS);
          return;
        }

        // Log de finalização com placar e timestamp ISO 8601 (Req 5.6)
        this.logger.log(
          `✅ Partida finalizada | gameId=${gameId} placar=${homeScore}x${awayScore} timestamp=${now}`,
        );

        // Encerrar monitoramento (Req 6.3)
        await this.stopPolling(gameId, 'Partida finalizada com sucesso');

        // Calcular pontos (Req 5.2)
        try {
          await this.schedulerService.calculateGamePoints(gameId);
        } catch (calcError) {
          // Manter status finished para reprocessamento posterior (Req 5.4)
          this.logger.error(
            `❌ Erro ao calcular pontos | gameId=${gameId} error=${calcError instanceof Error ? calcError.message : String(calcError)}`,
          );
        }

        return;
      }

      // Status PENALTY_SHOOTOUT: reagendar +1min, zerar erros, log primeira transição (Req 1.1, 1.2, 1.3, 1.4, 7.1)
      // Deve ser verificado ANTES de IN_PLAY_STATUSES para garantir tratamento dedicado com intervalo reduzido
      if (status === 'PENALTY_SHOOTOUT') {
        if (job) {
          job.consecutiveErrors = 0;

          // Detectar primeira transição para PENALTY_SHOOTOUT e emitir log INFO apenas uma vez
          if (job.lastApiStatus !== 'PENALTY_SHOOTOUT') {
            this.logger.log(
              `⚽ Partida em disputa de pênaltis | gameId=${gameId} externalMatchId=${externalMatchId}`,
            );
          }

          job.lastApiStatus = status;
        }

        // Reagendar com intervalo reduzido de 60s (pênaltis são rápidos)
        this.reschedulePolling(gameId, externalMatchId, POLL_INTERVAL_PENALTY_MS);
        return;
      }

      // Status in-play: reagendar +2min, zerar erros (Req 4.3)
      if (IN_PLAY_STATUSES.includes(status)) {
        if (job) {
          job.consecutiveErrors = 0;
          job.lastApiStatus = status;
        }
        this.reschedulePolling(gameId, externalMatchId, POLL_INTERVAL_IN_PLAY_MS);
        return;
      }

      // Status terminal: atualizar DB, interromper polling (Req 4.4)
      if (TERMINAL_STATUSES.includes(status)) {
        this.logger.warn(
          `⚠️ Status terminal recebido | gameId=${gameId} externalMatchId=${externalMatchId} status=${status}`,
        );

        const supabase = this.supabaseService.getAdminClient();
        const mappedStatus = STATUS_MAP[status] || 'postponed';

        await supabase
          .from('games')
          .update({
            status: mappedStatus,
            updated_at: new Date().toISOString(),
          })
          .eq('id', gameId);

        await this.stopPolling(gameId, `Status terminal: ${status}`);
        return;
      }

      // Outros status não tratados (SCHEDULED, TIMED): reagendar +2min
      // Nota: PENALTY_SHOOTOUT é tratado pelo handler dedicado acima (intervalo reduzido de 60s)
      if (job) {
        job.lastApiStatus = status;
      }
      this.reschedulePolling(gameId, externalMatchId, POLL_INTERVAL_IN_PLAY_MS);
    } catch (error) {
      // Tratar erros HTTP 5xx ou timeout (Req 4.5)
      const is5xxOrTimeout =
        (error instanceof FootballDataApiError && error.statusCode >= 500) ||
        (error instanceof Error && error.name === 'TimeoutError') ||
        (error instanceof Error && error.name === 'AbortError');

      if (job) {
        job.consecutiveErrors++;

        // 5 erros consecutivos: interromper polling (Req 4.6)
        if (job.consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
          this.logger.error(
            `❌ Polling interrompido (${MAX_CONSECUTIVE_ERRORS} erros consecutivos) | gameId=${gameId} externalMatchId=${externalMatchId}`,
          );
          await this.stopPolling(
            gameId,
            `${MAX_CONSECUTIVE_ERRORS} erros consecutivos`,
          );
          return;
        }
      }

      if (is5xxOrTimeout) {
        this.logger.warn(
          `⚠️ Erro no polling (tentativa ${job?.consecutiveErrors ?? '?'}) | gameId=${gameId} externalMatchId=${externalMatchId} error=${error instanceof Error ? error.message : String(error)}`,
        );
      } else {
        this.logger.error(
          `❌ Erro inesperado no polling | gameId=${gameId} externalMatchId=${externalMatchId} error=${error instanceof Error ? error.message : String(error)}`,
        );
      }

      // Reagendar +1min (Req 4.5)
      this.reschedulePolling(gameId, externalMatchId, POLL_INTERVAL_ERROR_MS);
    }
  }

  /**
   * Reagenda o polling de uma partida com o intervalo especificado.
   * Limpa o timeout anterior e cria um novo.
   */
  private reschedulePolling(
    gameId: string,
    externalMatchId: number,
    delayMs: number,
  ): void {
    const job = this.activeJobs.get(gameId);
    if (!job) {
      return;
    }

    // Limpar timeout anterior
    if (job.timeoutRef) {
      clearTimeout(job.timeoutRef);
    }

    // Agendar novo polling
    job.timeoutRef = setTimeout(() => {
      this.pollMatch(gameId, externalMatchId);
    }, delayMs);
  }

  /**
   * Retorna o Map de jobs ativos (para testes e inspeção).
   */
  getActiveJobs(): Map<string, PollingJob> {
    return this.activeJobs;
  }

  /**
   * Retorna os jobs ativos ordenados por prioridade de polling.
   * Quando >5 partidas simultâneas: ordena por tempo decorrido desde a
   * Match_End_Window (maior tempo de espera primeiro).
   * Partidas que não foram consultadas dentro de 4 minutos recebem prioridade máxima (fairness).
   */
  getPollingOrder(): PollingJob[] {
    const jobs = Array.from(this.activeJobs.values());

    // Log capacity saturation alert
    if (jobs.length > CAPACITY_SATURATION_THRESHOLD) {
      this.logger.warn(
        `🚨 Capacidade de polling saturada | monitoredMatches=${jobs.length} threshold=${CAPACITY_SATURATION_THRESHOLD} — partidas poderão sofrer atraso na verificação de resultado`,
      );
    }

    // If 5 or fewer matches, no priority ordering needed
    if (jobs.length <= PRIORITY_THRESHOLD) {
      return jobs;
    }

    const now = new Date();

    return jobs.sort((a, b) => {
      const aStarved = this.isStarved(a, now);
      const bStarved = this.isStarved(b, now);

      // Starved jobs (not polled within 4 min) get absolute priority
      if (aStarved && !bStarved) return -1;
      if (!aStarved && bStarved) return 1;

      // Among same-priority jobs, sort by elapsed time since Match_End_Window (descending)
      const aElapsed = this.getElapsedSinceMatchEndWindow(a, now);
      const bElapsed = this.getElapsedSinceMatchEndWindow(b, now);

      return bElapsed - aElapsed;
    });
  }

  /**
   * Verifica se um job está "faminto" — não foi consultado dentro do intervalo de fairness (4 min).
   */
  private isStarved(job: PollingJob, now: Date): boolean {
    if (job.lastPolledAt === null) {
      // Never polled — starved if Match_End_Window already passed and it's been >4 min since scheduling
      const matchEndWindow = new Date(
        new Date(job.matchDate).getTime() + MATCH_DURATION_MS,
      );
      if (now.getTime() > matchEndWindow.getTime()) {
        const timeSinceScheduled = now.getTime() - job.scheduledAt.getTime();
        return timeSinceScheduled >= MAX_FAIRNESS_INTERVAL_MS;
      }
      return false;
    }

    const timeSinceLastPoll = now.getTime() - job.lastPolledAt.getTime();
    return timeSinceLastPoll >= MAX_FAIRNESS_INTERVAL_MS;
  }

  /**
   * Calcula o tempo decorrido (em ms) desde a Match_End_Window de um job.
   * Retorna 0 se a Match_End_Window ainda não foi atingida.
   */
  private getElapsedSinceMatchEndWindow(job: PollingJob, now: Date): number {
    const matchEndWindow = new Date(
      new Date(job.matchDate).getTime() + MATCH_DURATION_MS,
    );
    return Math.max(0, now.getTime() - matchEndWindow.getTime());
  }

  /**
   * Verifica se o polling de uma partida excedeu o timeout de segurança.
   * O timeout é atingido quando o tempo decorrido desde a Match_End_Window
   * (match_date + 90min) ultrapassa 180 minutos.
   *
   * Safety timeout = match_date + 90min + 180min = match_date + 270min total.
   */
  isPollingTimedOut(job: PollingJob): boolean {
    const matchEndWindow = new Date(job.matchDate).getTime() + MATCH_DURATION_MS;
    const safetyDeadline = matchEndWindow + SAFETY_TIMEOUT_MS;
    return Date.now() > safetyDeadline;
  }

  /**
   * Interrompe o polling de uma partida, limpando o job ativo,
   * definindo is_monitoring = false e logando o motivo.
   */
  async stopPolling(gameId: string, reason: string): Promise<void> {
    const job = this.activeJobs.get(gameId);

    if (job) {
      // Limpar o timeout agendado se houver
      if (job.timeoutRef) {
        clearTimeout(job.timeoutRef);
        job.timeoutRef = null;
      }
      this.activeJobs.delete(gameId);
    }

    // Definir is_monitoring = false no banco
    await this.setMonitoringFlag(gameId, false);

    this.logger.warn(
      `⚠️ Polling interrompido | gameId=${gameId} reason=${reason}`,
    );
  }

  /**
   * Define a flag `is_monitoring` no banco de dados para um jogo.
   */
  private async setMonitoringFlag(
    gameId: string,
    isMonitoring: boolean,
  ): Promise<void> {
    const supabase = this.supabaseService.getAdminClient();

    const { error } = await supabase
      .from('games')
      .update({
        is_monitoring: isMonitoring,
        updated_at: new Date().toISOString(),
      })
      .eq('id', gameId);

    if (error) {
      this.logger.error(
        `❌ Erro ao atualizar is_monitoring | gameId=${gameId} isMonitoring=${isMonitoring} error=${error.message}`,
      );
    }
  }
}
