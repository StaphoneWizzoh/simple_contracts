import { prisma } from "../../../db";
import { requirePermission, PERMISSIONS } from "../../../utils/permissions";

export default defineEventHandler(async (event) => {
    const ctx = await requirePermission(event, PERMISSIONS.VIEW_REPORTS);
    const query = getQuery(event);
    const thresholdDays = Math.max(1, parseInt(String(query.thresholdDays ?? "3"), 10) || 3);

    const cutoff = new Date(Date.now() - thresholdDays * 86400_000);

    const contracts = await prisma.contract.findMany({
        where: {
            organizationId: ctx.organizationId,
            status: { in: ["REVIEW", "SENT_FOR_SIGNING"] },
            updatedAt: { lte: cutoff },
        },
        select: {
            id: true,
            title: true,
            status: true,
            contractType: true,
            counterpartyName: true,
            updatedAt: true,
            createdAt: true,
            ownerUser: { select: { id: true, name: true, email: true } },
            approvals: {
                where: { status: "PENDING" },
                select: {
                    approver: { select: { id: true, name: true, email: true } },
                    order: true,
                },
            },
        },
        orderBy: { updatedAt: "asc" },
    });

    const now = Date.now();
    return {
        thresholdDays,
        contracts: contracts.map((c) => ({
            ...c,
            staleDays: Math.floor((now - c.updatedAt.getTime()) / 86400_000),
        })),
    };
});
