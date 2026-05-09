import { prisma } from "../../../../db";
import { requirePermission, PERMISSIONS } from "../../../../utils/permissions";
import type { AddSignatoryBody } from "../../../../types/contracts";

export default defineEventHandler(async (event) => {
    const ctx = await requirePermission(event, PERMISSIONS.SEND_FOR_SIGNING);
    const contractId = getRouterParam(event, "id");
    const body = await readBody<AddSignatoryBody>(event);

    if (!contractId) throw createError({ statusCode: 400, statusMessage: "Contract ID required" });
    if (!body?.legalName?.trim()) throw createError({ statusCode: 400, statusMessage: "Legal name is required" });
    if (!body?.email?.trim()) throw createError({ statusCode: 400, statusMessage: "Email is required" });

    const contract = await prisma.contract.findFirst({
        where: { id: contractId, organizationId: ctx.organizationId },
    });

    if (!contract) throw createError({ statusCode: 404, statusMessage: "Contract not found" });

    const party = await prisma.contractParty.create({
        data: {
            contractId,
            legalName: body.legalName.trim(),
            email: body.email.trim().toLowerCase(),
            title: body.title?.trim() ?? null,
            organization: body.organization?.trim() ?? null,
            signingOrder: body.signingOrder ?? null,
            role: "COUNTERPARTY",
        },
    });

    await prisma.contractAuditLog.create({
        data: {
            contractId,
            actorUserId: ctx.userId,
            eventType: "SIGNATORY_ADDED",
            details: JSON.stringify({ partyId: party.id, legalName: party.legalName, email: party.email }),
        },
    });

    return { signatory: party };
});
