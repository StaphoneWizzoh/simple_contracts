import { prisma } from "../../../../db";
import { getOrgContext } from "../../../../utils/permissions";

export default defineEventHandler(async (event) => {
    const ctx = await getOrgContext(event);
    const contractId = getRouterParam(event, "id");

    if (!contractId) {
        throw createError({ statusCode: 400, statusMessage: "Contract ID required" });
    }

    const contract = await prisma.contract.findFirst({
        where: { id: contractId, organizationId: ctx.organizationId },
        select: { id: true },
    });

    if (!contract) {
        throw createError({ statusCode: 404, statusMessage: "Contract not found" });
    }

    const logs = await prisma.contractAuditLog.findMany({
        where: { contractId },
        include: {
            actorUser: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
    });

    return {
        auditLog: logs.map((l) => ({
            id: l.id,
            eventType: l.eventType,
            details: l.details ? JSON.parse(l.details) : null,
            actorId: l.actorUserId,
            actorName: l.actorUser?.name ?? null,
            actorEmail: l.actorUser?.email ?? null,
            createdAt: l.createdAt,
        })),
    };
});
