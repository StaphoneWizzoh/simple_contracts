import { prisma } from "../../../db";
import { requirePermission, PERMISSIONS } from "../../../utils/permissions";
import { getCached, setCached } from "../../../utils/reportCache";

export default defineEventHandler(async (event) => {
    const ctx = await requirePermission(event, PERMISSIONS.VIEW_REPORTS);
    const query = getQuery(event);
    const dateFrom = typeof query.dateFrom === "string" ? new Date(query.dateFrom) : undefined;
    const dateTo = typeof query.dateTo === "string" ? new Date(query.dateTo) : undefined;
    const contractType = typeof query.contractType === "string" ? query.contractType : undefined;
    const cacheKey = `report:${ctx.organizationId}:value-summary:${dateFrom?.toISOString() ?? ""}:${dateTo?.toISOString() ?? ""}:${contractType ?? ""}`;
    const cached = getCached(cacheKey);
    if (cached) return cached;

    const baseWhere = {
        organizationId: ctx.organizationId,
        totalValueMinor: { not: null },
        ...(contractType ? { contractType } : {}),
        ...(dateFrom || dateTo ? { createdAt: { ...(dateFrom ? { gte: dateFrom } : {}), ...(dateTo ? { lte: dateTo } : {}) } } : {}),
    };

    const [overall, byStatus, byType] = await Promise.all([
        prisma.contract.aggregate({
            where: baseWhere,
            _sum: { totalValueMinor: true },
            _avg: { totalValueMinor: true },
            _count: { totalValueMinor: true },
            _max: { totalValueMinor: true },
            _min: { totalValueMinor: true },
        }),
        prisma.contract.groupBy({
            by: ["status"],
            where: baseWhere,
            _sum: { totalValueMinor: true },
            _count: { id: true },
        }),
        prisma.contract.groupBy({
            by: ["contractType"],
            where: baseWhere,
            _sum: { totalValueMinor: true },
            _count: { id: true },
        }),
    ]);

    const result = {
        overall: {
            totalMinor: overall._sum.totalValueMinor ?? 0,
            avgMinor: overall._avg.totalValueMinor ? Math.round(overall._avg.totalValueMinor) : 0,
            maxMinor: overall._max.totalValueMinor ?? 0,
            minMinor: overall._min.totalValueMinor ?? 0,
            count: overall._count.totalValueMinor,
        },
        byStatus: byStatus.map((g) => ({
            status: g.status,
            totalMinor: g._sum.totalValueMinor ?? 0,
            count: g._count.id,
        })),
        byType: byType
            .map((g) => ({
                contractType: g.contractType,
                totalMinor: g._sum.totalValueMinor ?? 0,
                count: g._count.id,
            }))
            .sort((a, b) => b.totalMinor - a.totalMinor),
    };

    setCached(cacheKey, result);
    return result;
});
