import { prisma } from "../../../db";
import { requirePermission, PERMISSIONS } from "../../../utils/permissions";
import { getCached, setCached } from "../../../utils/reportCache";

export default defineEventHandler(async (event) => {
    const ctx = await requirePermission(event, PERMISSIONS.VIEW_REPORTS);
    const cacheKey = `report:${ctx.organizationId}:summary`;
    const cached = getCached(cacheKey);
    if (cached) return cached;

    const now = new Date();
    const in30 = new Date(now.getTime() + 30 * 86400_000);
    const in60 = new Date(now.getTime() + 60 * 86400_000);
    const in90 = new Date(now.getTime() + 90 * 86400_000);

    const [statusGroups, valueAgg, expiring30, expiring60, expiring90] = await Promise.all([
        prisma.contract.groupBy({
            by: ["status"],
            where: { organizationId: ctx.organizationId },
            _count: { id: true },
        }),
        prisma.contract.aggregate({
            where: { organizationId: ctx.organizationId, totalValueMinor: { not: null } },
            _sum: { totalValueMinor: true },
            _avg: { totalValueMinor: true },
            _count: { totalValueMinor: true },
        }),
        prisma.contract.count({
            where: { organizationId: ctx.organizationId, status: "ACTIVE", expiresAt: { gte: now, lte: in30 } },
        }),
        prisma.contract.count({
            where: { organizationId: ctx.organizationId, status: "ACTIVE", expiresAt: { gte: now, lte: in60 } },
        }),
        prisma.contract.count({
            where: { organizationId: ctx.organizationId, status: "ACTIVE", expiresAt: { gte: now, lte: in90 } },
        }),
    ]);

    const byStatus = Object.fromEntries(statusGroups.map((g) => [g.status, g._count.id]));
    const total = statusGroups.reduce((sum, g) => sum + g._count.id, 0);

    const result = {
        total,
        byStatus,
        expiringSoon: { days30: expiring30, days60: expiring60, days90: expiring90 },
        value: {
            totalMinor: valueAgg._sum.totalValueMinor ?? 0,
            avgMinor: valueAgg._avg.totalValueMinor ? Math.round(valueAgg._avg.totalValueMinor) : 0,
            contractsWithValue: valueAgg._count.totalValueMinor,
        },
    };

    setCached(cacheKey, result);
    return result;
});
