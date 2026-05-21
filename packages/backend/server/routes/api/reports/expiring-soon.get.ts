import { prisma } from "../../../db";
import { requirePermission, PERMISSIONS } from "../../../utils/permissions";

export default defineEventHandler(async (event) => {
    const ctx = await requirePermission(event, PERMISSIONS.VIEW_REPORTS);
    const query = getQuery(event);
    const days = Math.min(365, Math.max(1, parseInt(String(query.days ?? "90"), 10) || 90));

    const now = new Date();
    const threshold = new Date(now.getTime() + days * 86400_000);

    const contracts = await prisma.contract.findMany({
        where: {
            organizationId: ctx.organizationId,
            status: "ACTIVE",
            expiresAt: { gte: now, lte: threshold },
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

    return {
        days,
        contracts: contracts.map((c) => ({
            ...c,
            daysUntilExpiry: c.expiresAt
                ? Math.ceil((c.expiresAt.getTime() - now.getTime()) / 86400_000)
                : null,
        })),
    };
});
