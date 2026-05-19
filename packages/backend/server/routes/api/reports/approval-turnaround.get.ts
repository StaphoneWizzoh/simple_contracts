import { prisma } from "../../../db";
import { requirePermission, PERMISSIONS } from "../../../utils/permissions";
import { getCached, setCached } from "../../../utils/reportCache";

export default defineEventHandler(async (event) => {
    const ctx = await requirePermission(event, PERMISSIONS.VIEW_REPORTS);
    const query = getQuery(event);
    const dateFrom = typeof query.dateFrom === "string" ? new Date(query.dateFrom) : undefined;
    const dateTo = typeof query.dateTo === "string" ? new Date(query.dateTo) : undefined;
    const cacheKey = `report:${ctx.organizationId}:approval-turnaround:${dateFrom?.toISOString() ?? ""}:${dateTo?.toISOString() ?? ""}`;
    const cached = getCached(cacheKey);
    if (cached) return cached;

    const dateFilter = dateFrom || dateTo
        ? { ...(dateFrom ? { gte: dateFrom } : {}), ...(dateTo ? { lte: dateTo } : {}) }
        : undefined;

    const approvals = await prisma.contractApproval.findMany({
        where: {
            contract: { organizationId: ctx.organizationId },
            status: { in: ["APPROVED", "REJECTED"] },
            actedAt: { not: null },
            ...(dateFilter ? { actedAt: dateFilter } : {}),
        },
        select: { createdAt: true, actedAt: true, status: true },
    });

    if (approvals.length === 0) {
        const empty = { count: 0, avgDays: null, minDays: null, maxDays: null, approvedCount: 0, rejectedCount: 0 };
        setCached(cacheKey, empty);
        return empty;
    }

    const durations = approvals
        .filter((a) => a.actedAt)
        .map((a) => (a.actedAt!.getTime() - a.createdAt.getTime()) / 86400_000);

    const result = {
        count: durations.length,
        avgDays: parseFloat((durations.reduce((s, d) => s + d, 0) / durations.length).toFixed(1)),
        minDays: parseFloat(Math.min(...durations).toFixed(1)),
        maxDays: parseFloat(Math.max(...durations).toFixed(1)),
        approvedCount: approvals.filter((a) => a.status === "APPROVED").length,
        rejectedCount: approvals.filter((a) => a.status === "REJECTED").length,
    };

    setCached(cacheKey, result);
    return result;
});
