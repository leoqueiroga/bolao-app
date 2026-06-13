import { Injectable, Logger } from '@nestjs/common';

/** Metrics exposed by the rate limiter */
export interface RateLimiterMetrics {
  requestsInWindow: number;
  queueSize: number;
  lastRequestTimestamp: number | null;
}

/** Error thrown when the queue is full */
export class QueueFullError extends Error {
  constructor() {
    super('Rate limiter queue is full. Service temporarily unavailable.');
    this.name = 'QueueFullError';
  }
}

/** Error thrown when max retries after 429 are exhausted */
export class RateLimitExceededError extends Error {
  constructor() {
    super('API rate limit exceeded after maximum retries.');
    this.name = 'RateLimitExceededError';
  }
}

/** Error indicating an HTTP 429 response from the API */
export class TooManyRequestsError extends Error {
  public readonly statusCode = 429;
  constructor(message = 'Too Many Requests') {
    super(message);
    this.name = 'TooManyRequestsError';
  }
}

interface QueueItem<T> {
  requestFn: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (reason: unknown) => void;
  retryCount: number;
}

@Injectable()
export class RateLimiterService {
  private readonly logger = new Logger(RateLimiterService.name);

  /** Sliding window config */
  private readonly WINDOW_SIZE_MS = 60_000; // 60 seconds
  private readonly MAX_REQUESTS_PER_WINDOW = 8;
  private readonly MIN_INTERVAL_MS = 7_500; // 7.5 seconds
  private readonly MAX_QUEUE_SIZE = 20;
  private readonly MAX_429_RETRIES = 3;
  private readonly RETRY_DELAY_MS = 60_000; // 60 seconds wait after 429

  /** Timestamps of executed requests within the sliding window */
  private requestTimestamps: number[] = [];

  /** Timestamp of the last executed request */
  private lastRequestTimestamp: number | null = null;

  /** FIFO queue of pending requests */
  private queue: QueueItem<any>[] = [];

  /** Whether the processor is currently active */
  private processing = false;

  /**
   * Executes a request respecting rate limits.
   * If the limit is reached, the request is queued (FIFO, max 20 items).
   * Throws QueueFullError if the queue is at capacity.
   */
  execute<T>(requestFn: () => Promise<T>): Promise<T> {
    if (this.queue.length >= this.MAX_QUEUE_SIZE) {
      this.logger.warn(
        `⚠️ Fila de rate limiting cheia (${this.MAX_QUEUE_SIZE} itens). Requisição rejeitada.`,
      );
      return Promise.reject(new QueueFullError());
    }

    const promise = new Promise<T>((resolve, reject) => {
      this.queue.push({ requestFn, resolve, reject, retryCount: 0 });
    });

    this.startProcessing();
    return promise;
  }

  /** Returns current metrics of the rate limiter */
  getMetrics(): RateLimiterMetrics {
    this.pruneExpiredTimestamps();
    return {
      requestsInWindow: this.requestTimestamps.length,
      queueSize: this.queue.length,
      lastRequestTimestamp: this.lastRequestTimestamp,
    };
  }

  /** Starts processing the queue if not already running */
  private startProcessing(): void {
    if (this.processing) return;
    this.processing = true;
    this.processLoop();
  }

  /** Main processing loop - processes items sequentially respecting rate limits */
  private async processLoop(): Promise<void> {
    try {
      while (this.queue.length > 0) {
        const waitTime = this.getWaitTime();
        if (waitTime > 0) {
          await this.sleep(waitTime);
        }

        if (this.queue.length === 0) break;

        const item = this.queue.shift()!;
        await this.executeItem(item);
      }
    } finally {
      this.processing = false;
    }
  }

  /** Executes a single queued item with 429 retry logic */
  private async executeItem<T>(item: QueueItem<T>): Promise<void> {
    try {
      const now = this.now();
      this.recordRequest(now);
      const result = await item.requestFn();
      item.resolve(result);
    } catch (error) {
      if (this.is429Error(error)) {
        if (item.retryCount < this.MAX_429_RETRIES) {
          item.retryCount++;
          this.logger.warn(
            `⚠️ HTTP 429 recebido. Aguardando 60s antes de retentar (tentativa ${item.retryCount}/${this.MAX_429_RETRIES}).`,
          );
          // Re-queue at the front for retry after delay
          this.queue.unshift(item);
          await this.sleep(this.RETRY_DELAY_MS);
        } else {
          this.logger.warn(
            `⚠️ HTTP 429 - Máximo de ${this.MAX_429_RETRIES} tentativas atingido. Requisição descartada.`,
          );
          item.reject(new RateLimitExceededError());
        }
      } else {
        item.reject(error);
      }
    }
  }

  /**
   * Calculates how long to wait before the next request can be made.
   * Returns 0 if a request can be made immediately.
   */
  private getWaitTime(): number {
    const now = this.now();
    this.pruneExpiredTimestamps();

    let waitTime = 0;

    // Check sliding window limit
    if (this.requestTimestamps.length >= this.MAX_REQUESTS_PER_WINDOW) {
      const oldestInWindow = this.requestTimestamps[0];
      const windowWait = oldestInWindow + this.WINDOW_SIZE_MS - now;
      waitTime = Math.max(waitTime, windowWait);
    }

    // Check minimum interval between consecutive calls
    if (this.lastRequestTimestamp !== null) {
      const intervalWait = this.lastRequestTimestamp + this.MIN_INTERVAL_MS - now;
      waitTime = Math.max(waitTime, intervalWait);
    }

    return Math.max(0, waitTime);
  }

  /** Records a request timestamp */
  private recordRequest(timestamp: number): void {
    this.requestTimestamps.push(timestamp);
    this.lastRequestTimestamp = timestamp;
  }

  /** Removes timestamps outside the sliding window */
  private pruneExpiredTimestamps(): void {
    const windowStart = this.now() - this.WINDOW_SIZE_MS;
    this.requestTimestamps = this.requestTimestamps.filter((ts) => ts > windowStart);
  }

  /** Checks if an error represents an HTTP 429 response */
  private is429Error(error: unknown): boolean {
    if (error instanceof TooManyRequestsError) return true;
    if (error && typeof error === 'object') {
      const err = error as Record<string, unknown>;
      if (err.statusCode === 429 || err.status === 429) return true;
      if (err.response && typeof err.response === 'object') {
        const response = err.response as Record<string, unknown>;
        if (response.status === 429 || response.statusCode === 429) return true;
      }
    }
    return false;
  }

  /** Returns current time in ms */
  protected now(): number {
    return Date.now();
  }

  /** Sleeps for the specified duration */
  protected sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
