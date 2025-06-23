import { LRUCache } from "lru-cache";

export type RateLimitOptions = {
  interval: number; // Time window in milliseconds
  uniqueTokenPerInterval?: number; // Max number of unique tokens per interval
};

export function rateLimit(options: RateLimitOptions) {
  const tokenCache = new LRUCache({
    max: options.uniqueTokenPerInterval || 500,
    ttl: options.interval,
  });

  return {
    check: async (token: string, limit: number) => {
      const tokenCount = (tokenCache.get(token) as number[]) || [0];

      if (tokenCount[0] === 0) {
        tokenCache.set(token, [1]);
        return {
          success: true,
          limit,
          remaining: limit - 1,
          reset: Date.now() + options.interval,
        };
      }

      if (tokenCount[0] >= limit) {
        return {
          success: false,
          limit,
          remaining: 0,
          reset: Date.now() + options.interval,
        };
      }

      tokenCount[0] += 1;
      tokenCache.set(token, tokenCount);

      return {
        success: true,
        limit,
        remaining: limit - tokenCount[0],
        reset: Date.now() + options.interval,
      };
    },
  };
}

// Rate limiter instances
export const authRateLimiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 200,
});
