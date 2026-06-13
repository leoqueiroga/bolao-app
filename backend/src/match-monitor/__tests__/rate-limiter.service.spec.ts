import {
  RateLimiterService,
  QueueFullError,
  RateLimitExceededError,
  TooManyRequestsError,
} from '../rate-limiter.service';

/**
 * Testable subclass that allows manual time control.
 * Overrides now() and sleep() to make tests deterministic and fast.
 */
class TestableRateLimiter extends RateLimiterService {
  public currentTime = 0;
  private pendingSleeps: Array<{ duration: number; resolve: () => void }> = [];

  protected override now(): number {
    return this.currentTime;
  }

  protected override sleep(ms: number): Promise<void> {
    return new Promise<void>((resolve) => {
      this.pendingSleeps.push({ duration: ms, resolve });
    });
  }

  /** Advance time and resolve all sleeps that should have completed */
  flushSleeps(): void {
    // Advance time by the first pending sleep duration and resolve it
    if (this.pendingSleeps.length > 0) {
      const sleep = this.pendingSleeps.shift()!;
      this.currentTime += sleep.duration;
      sleep.resolve();
    }
  }

  /** Advance time by a specific amount and resolve matching sleeps */
  advanceTime(ms: number): void {
    this.currentTime += ms;
    const toResolve = this.pendingSleeps.filter(
      (s) => true, // resolve all pending - in practice only one is pending at a time
    );
    this.pendingSleeps = [];
    for (const s of toResolve) {
      s.resolve();
    }
  }

  /** Number of pending sleeps */
  get pendingSleepCount(): number {
    return this.pendingSleeps.length;
  }
}

/**
 * Helper to flush microtasks (allows async code to proceed)
 */
function flushMicrotasks(): Promise<void> {
  return new Promise((resolve) => setImmediate(resolve));
}

describe('RateLimiterService', () => {
  describe('getMetrics - initial state', () => {
    it('should return empty metrics initially', () => {
      const service = new TestableRateLimiter();
      expect(service.getMetrics()).toEqual({
        requestsInWindow: 0,
        queueSize: 0,
        lastRequestTimestamp: null,
      });
    });
  });

  describe('execute - basic behavior', () => {
    it('should execute a single request and return its result', async () => {
      const service = new TestableRateLimiter();
      const fn = jest.fn().mockResolvedValue('hello');

      const promise = service.execute(fn);
      await flushMicrotasks();

      const result = await promise;
      expect(result).toBe('hello');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should propagate non-429 errors immediately', async () => {
      const service = new TestableRateLimiter();
      const error = new Error('boom');

      const promise = service.execute(async () => {
        throw error;
      });
      await flushMicrotasks();

      await expect(promise).rejects.toThrow('boom');
    });

    it('should update metrics after successful execution', async () => {
      const service = new TestableRateLimiter();

      const promise = service.execute(async () => 'done');
      await flushMicrotasks();
      await promise;

      const metrics = service.getMetrics();
      expect(metrics.requestsInWindow).toBe(1);
      expect(metrics.lastRequestTimestamp).toBe(0);
      expect(metrics.queueSize).toBe(0);
    });
  });

  describe('execute - minimum interval enforcement', () => {
    it('should wait 7.5s between consecutive calls', async () => {
      const service = new TestableRateLimiter();
      const executionTimes: number[] = [];

      const p1 = service.execute(async () => {
        executionTimes.push(service.currentTime);
        return 1;
      });
      const p2 = service.execute(async () => {
        executionTimes.push(service.currentTime);
        return 2;
      });

      // First executes immediately
      await flushMicrotasks();
      expect(executionTimes).toEqual([0]);

      // Second is waiting for min interval
      expect(service.pendingSleepCount).toBe(1);
      service.flushSleeps(); // advances time by 7500
      await flushMicrotasks();

      expect(executionTimes).toEqual([0, 7500]);
      await expect(p1).resolves.toBe(1);
      await expect(p2).resolves.toBe(2);
    });

    it('should enforce interval for multiple consecutive requests', async () => {
      const service = new TestableRateLimiter();
      const executionTimes: number[] = [];

      for (let i = 0; i < 4; i++) {
        service.execute(async () => {
          executionTimes.push(service.currentTime);
          return i;
        });
      }

      // Process all: first at 0, then 7500, 15000, 22500
      await flushMicrotasks(); // first executes
      for (let i = 1; i < 4; i++) {
        service.flushSleeps();
        await flushMicrotasks();
      }

      expect(executionTimes).toEqual([0, 7500, 15000, 22500]);
    });
  });

  describe('execute - sliding window enforcement', () => {
    it('should not exceed 8 requests in a 60s window', async () => {
      const service = new TestableRateLimiter();
      const executionTimes: number[] = [];

      // Submit 9 requests
      for (let i = 0; i < 9; i++) {
        service.execute(async () => {
          executionTimes.push(service.currentTime);
          return i;
        });
      }

      // Process first 8 (each at 7500ms intervals = 0, 7500, ..., 52500)
      await flushMicrotasks(); // req 1 at t=0
      for (let i = 1; i < 8; i++) {
        service.flushSleeps();
        await flushMicrotasks();
      }

      expect(executionTimes.length).toBe(8);
      expect(executionTimes[7]).toBe(52500);

      // 9th request: window has 8 requests (first at t=0).
      // Need to wait until t=60000 (window slides past first req) AND min interval from 52500.
      // Max(60000 - 52500, 7500) = max(7500, 7500) = 7500
      // So wait time is 7500 ms (from 52500 -> 60000 satisfies both constraints)
      service.flushSleeps();
      await flushMicrotasks();

      expect(executionTimes.length).toBe(9);
      expect(executionTimes[8]).toBe(60000);
    });
  });

  describe('execute - FIFO ordering', () => {
    it('should execute requests in submission order', async () => {
      const service = new TestableRateLimiter();
      const order: number[] = [];

      service.execute(async () => { order.push(1); return 1; });
      service.execute(async () => { order.push(2); return 2; });
      service.execute(async () => { order.push(3); return 3; });

      await flushMicrotasks();
      service.flushSleeps();
      await flushMicrotasks();
      service.flushSleeps();
      await flushMicrotasks();

      expect(order).toEqual([1, 2, 3]);
    });
  });

  describe('queue capacity', () => {
    it('should reject when queue reaches 20 items', async () => {
      const service = new TestableRateLimiter();

      // Fill queue with 20 items (first will start processing, 19 queued + 1 processing)
      // Actually execute puts item in queue first, then starts processing
      // First item gets processed immediately, leaving 19 in queue
      for (let i = 0; i < 20; i++) {
        service.execute(async () => i);
      }
      await flushMicrotasks(); // first executes, 19 remain queued

      // 21st should be rejected (queue has 19 items + 1 just taken = queue shows 19)
      // Let's just fill the queue to exactly 20
      service.execute(async () => 'extra'); // now 20 in queue

      await expect(service.execute(async () => 'overflow')).rejects.toThrow(
        QueueFullError,
      );
    });

    it('should show queue size in metrics', async () => {
      const service = new TestableRateLimiter();

      // Execute first
      service.execute(async () => 'first');
      await flushMicrotasks();

      // These will queue
      service.execute(async () => 'second');
      service.execute(async () => 'third');

      const metrics = service.getMetrics();
      expect(metrics.queueSize).toBe(2);
    });
  });

  describe('HTTP 429 retry logic', () => {
    it('should retry after 60 seconds on 429 error', async () => {
      const service = new TestableRateLimiter();
      let attempts = 0;

      const promise = service.execute(async () => {
        attempts++;
        if (attempts === 1) throw new TooManyRequestsError();
        return 'recovered';
      });

      await flushMicrotasks(); // first attempt fails with 429
      expect(attempts).toBe(1);

      // Should be sleeping for 60s retry delay
      expect(service.pendingSleepCount).toBe(1);
      service.flushSleeps(); // advances 60000ms
      await flushMicrotasks();

      // Now it should have a wait time sleep (interval) before executing
      // Actually after the retry delay, processLoop continues to getWaitTime
      // Since we already advanced 60s, and last request was at t=0, interval of 7.5s is already met
      // BUT wait - the failed request WAS recorded (recordRequest happens before the fn call)
      // So lastRequestTimestamp = 0, and now we're at 60000. Interval: 0 + 7500 - 60000 < 0. No wait needed.
      expect(attempts).toBe(2);
      await expect(promise).resolves.toBe('recovered');
    });

    it('should throw RateLimitExceededError after 3 retries', async () => {
      const service = new TestableRateLimiter();
      let attempts = 0;

      const promise = service.execute(async () => {
        attempts++;
        throw new TooManyRequestsError();
      });

      // Attempt 1
      await flushMicrotasks();
      expect(attempts).toBe(1);

      // Retry 1 (after 60s)
      service.flushSleeps();
      await flushMicrotasks();
      expect(attempts).toBe(2);

      // Retry 2 (after 60s)
      service.flushSleeps();
      await flushMicrotasks();
      expect(attempts).toBe(3);

      // Retry 3 (after 60s) — max retries reached
      service.flushSleeps();
      await flushMicrotasks();
      expect(attempts).toBe(4);

      await expect(promise).rejects.toThrow(RateLimitExceededError);
    });

    it('should detect 429 from object with statusCode property', async () => {
      const service = new TestableRateLimiter();
      let attempts = 0;

      const promise = service.execute(async () => {
        attempts++;
        if (attempts === 1) {
          throw { statusCode: 429, message: 'rate limited' };
        }
        return 'ok';
      });

      await flushMicrotasks();
      expect(attempts).toBe(1);

      service.flushSleeps(); // 60s retry delay
      await flushMicrotasks();
      expect(attempts).toBe(2);

      await expect(promise).resolves.toBe('ok');
    });

    it('should detect 429 from nested response.status property', async () => {
      const service = new TestableRateLimiter();
      let attempts = 0;

      const promise = service.execute(async () => {
        attempts++;
        if (attempts === 1) {
          throw { response: { status: 429 } };
        }
        return 'ok';
      });

      await flushMicrotasks();
      service.flushSleeps();
      await flushMicrotasks();

      await expect(promise).resolves.toBe('ok');
    });
  });

  describe('non-429 errors', () => {
    it('should not retry on non-429 errors', async () => {
      const service = new TestableRateLimiter();
      let attempts = 0;

      const promise = service.execute(async () => {
        attempts++;
        throw new Error('Server error 500');
      });

      await flushMicrotasks();

      await expect(promise).rejects.toThrow('Server error 500');
      expect(attempts).toBe(1);
    });

    it('should continue processing queue after a non-429 error', async () => {
      const service = new TestableRateLimiter();
      const results: string[] = [];

      const p1 = service.execute(async () => {
        throw new Error('fail');
      });
      const p2 = service.execute(async () => {
        results.push('second');
        return 'second';
      });

      await flushMicrotasks(); // first fails
      await expect(p1).rejects.toThrow('fail');

      // Second should proceed after min interval
      service.flushSleeps();
      await flushMicrotasks();

      expect(results).toEqual(['second']);
      await expect(p2).resolves.toBe('second');
    });
  });
});
