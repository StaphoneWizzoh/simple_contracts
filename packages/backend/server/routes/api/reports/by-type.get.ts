import { prisma } from "../../../db";
import { requirePermission, PERMISSIONS } from "../../../utils/permissions";
import { getCached, setCached } from "../../../utils/reportCache";

export default defineEventHandler(async (event) => {
    const ctx = await requirePermission(event, PERMISSIONS.VIEW_REPORTS);
    const query = getQuery(event);
    const dateFrom = typeof query.dateFrom === "string" ? new Date(query.dateFrom) : undefined;
    const dateTo = typeof query.dateTo === "string" ? new Date(query.dateTo) : undefined;

    const cacheKey = `report:${ctx.organizationId}:by-type:${dateFrom?.toISOString() ?? ""}:${dateTo?.toISOString() ?? ""}`;
    const cached = getCached(cacheKey);
    if (cached) return cached;

    const dateFilter = dateFrom || dateTo
        ? { createdAt: { ...(dateFrom ? { gte: dateFrom } : {}), ...(dateTo ? { lte: dateTo } : {}) } }
        : {};

    const [groups, valueGroups] = await Promise.all([
        prisma.contract.groupBy({
            by: ["contractType"],
            where: { organizationId: ctx.organizationId, ...dateFilter },
            _count: { id: true },
        }),
        prisma.contract.groupBy({
            by: ["contractType"],
            where: { organizationId: ctx.organizationId, totalValueMinor: { not: null }, ...dateFilter },
            _sum: { totalValueMinor: true },
        }),
    ]);

    const valueByType = new Map(valueGroups.map((g) => [g.contractType, g._sum.totalValueMinor ?? 0]));

    const result = {
        types: groups
            .map((g) => ({
                contractType: g.contractType,
                count: g._count.id,
                totalValueMinor: valueByType.get(g.contractType) ?? 0,
            }))
            .sort((a, b) => b.count - a.count),
    };

    setCached(cacheKey, result);
    return result;
});
