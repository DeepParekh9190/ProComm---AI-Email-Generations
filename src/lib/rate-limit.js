const rateMap = new Map();

export function rateLimit({ interval = 60000, maxRequests = 20, key = "default" } = {}) {
  const now = Date.now();
  const entry = rateMap.get(key);

  if (!entry || now - entry.start > interval) {
    rateMap.set(key, { start: now, count: 1 });
    return { allowed: true };
  }

  entry.count += 1;

  if (entry.count > maxRequests) {
    return { allowed: false, retryAfter: Math.ceil((interval - (now - entry.start)) / 1000) };
  }

  return { allowed: true };
}

export function rateLimitByUser({ userId, ip, interval = 60000, maxRequests = 30 } = {}) {
  const key = userId ? `user:${userId}` : `ip:${ip || "unknown"}`;
  const now = Date.now();
  const entry = rateMap.get(key);

  if (!entry || now - entry.start > interval) {
    rateMap.set(key, { start: now, count: 1 });
    return { allowed: true };
  }

  entry.count += 1;

  if (entry.count > maxRequests) {
    return { allowed: false, retryAfter: Math.ceil((interval - (now - entry.start)) / 1000) };
  }

  return { allowed: true };
}

// Periodic cleanup to prevent memory leaks
try {
  if (typeof setInterval !== "undefined") {
    setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of rateMap) {
        if (now - entry.start > 60000) {
          rateMap.delete(key);
        }
      }
    }, 60000);
  }
} catch {
  // Cleanup interval not available in edge/serverless
}
