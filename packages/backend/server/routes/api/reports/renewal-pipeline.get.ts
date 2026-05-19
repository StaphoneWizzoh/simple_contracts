import { prisma } from "../../../db";
import { requirePermission, PERMISSIONS } from "../../../utils/permissions";

export default defineEventHandler(async (event) => {
    const ctx = await requirePermission(event, PERMISSIONS.VIEW_REPORTS);
    const now = new Date();

    const buckets = [30, 60, 90, 180];
    const thresholds = buckets.map((d) => new Date(now.getTime() + d * 86400_000));

    const contracts = await prisma.contract.findMany({
        where: {
            organizationId: ctx.organizationId,
            status: "ACTIVE",
            expiresAt: { gte: now, lte: thresholds[thresholds.length - 1] },
        },
        select: {
            id: true,
            title: true,
            contractType: true,
            counterpartyName: true,
            expiresAt: true,
            totalValueMinor: true,
            currencyCode: true,
            ownerUser: { select: { id: true, name: true, email: true } },
        },
        orderBy: { expiresAt: "asc" },
    });

    const bucketized = buckets.map((days, i) => ({
        days,
        contracts: contracts
            .filter((c) => c.expiresAt && c.expiresAt <= thresholds[i])
            .map((c) => ({
                ...c,
                daysUntilExpiry: c.expiresAt
                    ? Math.ceil((c.expiresAt.getTime() - now.getTime()) / 86400_000)
                    : null,
            })),
    }));

    return { buckets: bucketized };
});
