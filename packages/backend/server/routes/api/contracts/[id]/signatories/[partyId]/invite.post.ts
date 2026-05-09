import { prisma } from "../../../../../../db";
import { requirePermission, PERMISSIONS } from "../../../../../../utils/permissions";
import { randomUUID } from "crypto";
import { createHash } from "crypto";

export default defineEventHandler(async (event) => {
    const ctx = await requirePermission(event, PERMISSIONS.SEND_FOR_SIGNING);
    const contractId = getRouterParam(event, "id");
    const partyId = getRouterParam(event, "partyId");

    if (!contractId || !partyId) throw createError({ statusCode: 400, statusMessage: "IDs required" });

    const contract = await prisma.contract.findFirst({
        where: { id: contractId, organizationId: ctx.organizationId },
    });

    if (!contract) throw createError({ statusCode: 404, statusMessage: "Contract not found" });

    if (contract.status !== "SENT_FOR_SIGNING") {
        throw createError({ statusCode: 422, statusMessage: "Contract must be in 'Sent for Signing' status" });
    }

    const party = await prisma.contractParty.findFirst({
        where: { id: partyId, contractId },
    });

    if (!party) throw createError({ statusCode: 404, statusMessage: "Signatory not found" });

    let signature = await prisma.contractSignature.findFirst({
        where: { contractId, partyId },
        include: { signingToken: true },
    });

    if (!signature) {
        signature = await prisma.contractSignature.create({
            data: {
                contractId,
                contractVersionId: contract.currentVersionId,
                partyId,
                status: "PENDING",
            },
            include: { signingToken: true },
        });
    } else if (signature.signingToken) {
        // Invalidate old token before regenerating
        await prisma.signingToken.delete({ where: { id: signature.signingToken.id } });
    }

    const plainToken = randomUUID();
    const tokenHash = createHash("sha256").update(plainToken).digest("hex");
    const expiresAt = new Date(Date.now() + contract.signingLinkExpiryDays * 24 * 60 * 60 * 1000);

    await prisma.signingToken.create({
        data: {
            contractSignatureId: signature.id,
            token: tokenHash,
            expiresAt,
        },
    });

    await prisma.contractAuditLog.create({
        data: {
            contractId,
            actorUserId: ctx.userId,
            eventType: "SIGNING_LINK_GENERATED",
            details: JSON.stringify({ partyId, legalName: party.legalName, email: party.email }),
        },
    });

    return { signingUrl: `/sign/${plainToken}`, expiresAt };
});
