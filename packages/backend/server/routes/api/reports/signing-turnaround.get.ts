import { prisma } from "../../../db";
import { requirePermission, PERMISSIONS } from "../../../utils/permissions";
import { getCached, setCached } from "../../../utils/reportCache";

export default defineEventHandler(async (event) => {
    const ctx = await requirePermission(event, PERMISSIONS.VIEW_REPORTS);
    const query = getQuery(event);
    const dateFrom = typeof query.dateFrom === "string" ? new Date(query.dateFrom) : undefined;
    const dateTo = typeof query.dateTo === "string" ? new Date(query.dateTo) : undefined;
    const cacheKey = `report:${ctx.organizationId}:signing-turnaround:${dateFrom?.toISOString() ?? ""}:${dateTo?.toISOString() ?? ""}`;
    const cached = getCached(cacheKey);
    if (cached) return cached;

    // Find contracts that completed signing (ACTIVE), with sentForSigning and signedAt events
    const dateFilter = dateFrom || dateTo
        ? { ...(dateFrom ? { gte: dateFrom } : {}), ...(dateTo ? { lte: dateTo } : {}) }
        : undefined;

    const signatures = await prisma.contractSignature.findMany({
        where: {
            contract: { organizationId: ctx.organizationId },
            status: "SIGNED",
            signedAt: { not: null },
            ...(dateFilter ? { signedAt: dateFilter } : {}),
        },
        select: {
            contractId: true,
            requestedAt: true,
            signedAt: true,
        },
    });

    if (signatures.length === 0) {
        const empty = { count: 0, avgDays: null, minDays: null, maxDays: null, byContract: [] };
        setCached(cacheKey, empty);
        return empty;
    }

    // Group by contract: use max(signedAt) - min(requestedAt) per contract
    const byContract = new Map<string, { requestedAt: Date; signedAt: Date }>();
    for (const sig of signatures) {
        if (!sig.signedAt) continue;
        const existing = byContract.get(sig.contractId);
        if (!existing) {
            byContract.set(sig.contractId, { requestedAt: sig.requestedAt, signedAt: sig.signedAt });
        } else {
            if (sig.requestedAt < existing.requestedAt) existing.requestedAt = sig.requestedAt;
            if (sig.signedAt > existing.signedAt) existing.signedAt = sig.signedAt;
        }
    }

    const durations = Array.from(byContract.values()).map(
        (v) => (v.signedAt.getTime() - v.requestedAt.getTime()) / 86400_000,
    );

    const result = {
        count: durations.length,
        avgDays: parseFloat((durations.reduce((s, d) => s + d, 0) / durations.length).toFixed(1)),
        minDays: parseFloat(Math.min(...durations).toFixed(1)),
        maxDays: parseFloat(Math.max(...durations).toFixed(1)),
    };

    setCached(cacheKey, result);
    return result;
});
