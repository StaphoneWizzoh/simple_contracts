import { prisma } from "../../../../../db";
import { requirePermission, PERMISSIONS } from "../../../../../utils/permissions";

export default defineEventHandler(async (event) => {
    const ctx = await requirePermission(event, PERMISSIONS.SEND_FOR_SIGNING);
    const contractId = getRouterParam(event, "id");
    const partyId = getRouterParam(event, "partyId");

    if (!contractId || !partyId) throw createError({ statusCode: 400, statusMessage: "IDs required" });

    const contract = await prisma.contract.findFirst({
        where: { id: contractId, organizationId: ctx.organizationId },
    });

    if (!contract) throw createError({ statusCode: 404, statusMessage: "Contract not found" });

    const party = await prisma.contractParty.findFirst({
        where: { id: partyId, contractId },
    });

    if (!party) throw createError({ statusCode: 404, statusMessage: "Signatory not found" });

    await prisma.contractParty.delete({ where: { id: partyId } });

    await prisma.contractAuditLog.create({
        data: {
            contractId,
            actorUserId: ctx.userId,
            eventType: "SIGNATORY_REMOVED",
            details: JSON.stringify({ legalName: party.legalName, email: party.email }),
        },
    });

    return { success: true };
});
