const store = new Map<string, { count: number; resetAt: number }>();

/** Returns false if the caller has exceeded the limit, true otherwise. */
export function checkRateLimit(key: string, max = 30, windowMs = 60_000): boolean {
    const now = Date.now();
    const record = store.get(key);

    if (!record || record.resetAt <= now) {
        store.set(key, { count: 1, resetAt: now + windowMs });
        return true;
    }

    if (record.count >= max) return false;
    record.count++;
    return true;
}

/** Throws a 429 error if the IP has exceeded the rate limit. */
export function enforceRateLimit(event: any, max?: number, windowMs?: number): void {
    const ip =
        (event.node.req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim()
        ?? (event.node.req.socket as { remoteAddress?: string })?.remoteAddress
        ?? "unknown";

    if (!checkRateLimit(ip, max, windowMs)) {
        throw createError({ statusCode: 429, statusMessage: "Too many requests. Please try again later." });
    }
}
