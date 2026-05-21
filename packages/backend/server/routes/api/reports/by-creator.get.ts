import { prisma } from "../../../db";
import { requirePermission, PERMISSIONS } from "../../../utils/permissions";
import { getCached, setCached } from "../../../utils/reportCache";

export default defineEventHandler(async (event) => {
    const ctx = await requirePermission(event, PERMISSIONS.VIEW_REPORTS);
    const query = getQuery(event);
    const dateFrom = typeof query.dateFrom === "string" ? new Date(query.dateFrom) : undefined;
    const dateTo = typeof query.dateTo === "string" ? new Date(query.dateTo) : undefined;
    const cacheKey = `report:${ctx.organizationId}:by-creator:${dateFrom?.toISOString() ?? ""}:${dateTo?.toISOString() ?? ""}`;
    const cached = getCached(cacheKey);
    if (cached) return cached;

    const dateFilter = dateFrom || dateTo
        ? { createdAt: { ...(dateFrom ? { gte: dateFrom } : {}), ...(dateTo ? { lte: dateTo } : {}) } }
        : {};

    const [countGroups, valueGroups] = await Promise.all([
        prisma.contract.groupBy({
            by: ["createdByUserId"],
            where: { organizationId: ctx.organizationId, ...dateFilter },
            _count: { id: true },
        }),
        prisma.contract.groupBy({
            by: ["createdByUserId"],
            where: { organizationId: ctx.organizationId, totalValueMinor: { not: null }, ...dateFilter },
            _sum: { totalValueMinor: true },
        }),
    ]);

    const userIds = [...new Set(countGroups.map((g) => g.createdByUserId))];
    const users = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, name: true, email: true },
    });
    const userMap = new Map(users.map((u) => [u.id, u]));
    const valueMap = new Map(valueGroups.map((g) => [g.createdByUserId, g._sum.totalValueMinor ?? 0]));

    const result = {
        creators: countGroups
            .map((g) => ({
                userId: g.createdByUserId,
                user: userMap.get(g.createdByUserId) ?? null,
                count: g._count.id,
                totalValueMinor: valueMap.get(g.createdByUserId) ?? 0,
            }))
            .sort((a, b) => b.count - a.count),
    };

    setCached(cacheKey, result);
    return result;
});
