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

    const signature = await prisma.contractSignature.findFirst({
        where: { contractId, partyId },
        include: { signingToken: true },
    });

    if (signature?.status === "SIGNED") {
        throw createError({ statusCode: 422, statusMessage: "Signatory has already signed — link cannot be reissued" });
    }

    const plainToken = randomUUID();
    const tokenHash = createHash("sha256").update(plainToken).digest("hex");
    const expiresAt = new Date(Date.now() + contract.signingLinkExpiryDays * 24 * 60 * 60 * 1000);

    await prisma.$transaction(async (tx) => {
        if (!signature) {
            // First-time: create signature record + token together
            const created = await tx.contractSignature.create({
                data: {
                    contractId,
                    contractVersionId: contract.currentVersionId,
                    partyId,
                    status: "PENDING",
                },
            });
            await tx.signingToken.create({
                data: { contractSignatureId: created.id, token: tokenHash, expiresAt },
            });
        } else {
            // Revoke existing token if present
            if (signature.signingToken) {
                await tx.signingToken.delete({ where: { id: signature.signingToken.id } });
            }

            // For a declined signatory, reset back to PENDING so the new link works
            const resetData = signature.status === "DECLINED"
                ? { status: "PENDING", viewedAt: null, declinedAt: null, reason: null, ipAddress: null, userAgent: null }
                : {};

            await tx.contractSignature.update({ where: { id: signature.id }, data: resetData });
            await tx.signingToken.create({
                data: { contractSignatureId: signature.id, token: tokenHash, expiresAt },
            });
        }

        await tx.contractAuditLog.create({
            data: {
                contractId,
                actorUserId: ctx.userId,
                eventType: "SIGNING_LINK_GENERATED",
                details: JSON.stringify({
                    partyId,
                    legalName: party.legalName,
                    email: party.email,
                    regenerated: Boolean(signature),
                    previousStatus: signature?.status ?? null,
                }),
            },
        });
    });

    return { signingUrl: `/sign/${plainToken}`, expiresAt };
});
