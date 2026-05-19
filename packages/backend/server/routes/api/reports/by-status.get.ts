import { prisma } from "../../../db";
import { requirePermission, PERMISSIONS } from "../../../utils/permissions";
import { getCached, setCached } from "../../../utils/reportCache";

export default defineEventHandler(async (event) => {
    const ctx = await requirePermission(event, PERMISSIONS.VIEW_REPORTS);
    const query = getQuery(event);

    const months = Math.min(24, Math.max(1, parseInt(String(query.months ?? "6"), 10) || 6));
    const cacheKey = `report:${ctx.organizationId}:by-status:${months}`;
    const cached = getCached(cacheKey);
    if (cached) return cached;

    const since = new Date();
    since.setMonth(since.getMonth() - months);

    const [statusGroups, trendContracts] = await Promise.all([
        prisma.contract.groupBy({
            by: ["status"],
            where: { organizationId: ctx.organizationId },
            _count: { id: true },
        }),
        prisma.contract.findMany({
            where: { organizationId: ctx.organizationId, createdAt: { gte: since } },
            select: { createdAt: true, status: true },
            orderBy: { createdAt: "asc" },
        }),
    ]);

    // Bucket by month
    const trendMap = new Map<string, Record<string, number>>();
    for (const c of trendContracts) {
        const key = `${c.createdAt.getFullYear()}-${String(c.createdAt.getMonth() + 1).padStart(2, "0")}`;
        if (!trendMap.has(key)) trendMap.set(key, {});
        const bucket = trendMap.get(key)!;
        bucket[c.status] = (bucket[c.status] ?? 0) + 1;
    }

    const trend = Array.from(trendMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, counts]) => ({ month, ...counts }));

    const result = {
        current: statusGroups.map((g) => ({ status: g.status, count: g._count.id })),
        trend,
    };

    setCached(cacheKey, result);
    return result;
});
