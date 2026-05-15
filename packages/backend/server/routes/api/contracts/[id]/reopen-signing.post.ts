import { prisma } from "../../../../db";
import { requirePermission, PERMISSIONS } from "../../../../utils/permissions";

export default defineEventHandler(async (event) => {
    const ctx = await requirePermission(event, PERMISSIONS.MANAGE_ORG);
    const contractId = getRouterParam(event, "id");

    if (!contractId) throw createError({ statusCode: 400, statusMessage: "Contract ID required" });

    const contract = await prisma.contract.findFirst({
        where: { id: contractId, organizationId: ctx.organizationId },
    });

    if (!contract) throw createError({ statusCode: 404, statusMessage: "Contract not found" });

    if (contract.status !== "ACTIVE") {
        throw createError({ statusCode: 422, statusMessage: "Only active contracts can be reopened for signing" });
    }

    const totalParties = await prisma.contractParty.count({ where: { contractId } });
    const signedCount = await prisma.contractSignature.count({ where: { contractId, status: "SIGNED" } });

    if (signedCount >= totalParties) {
        throw createError({
            statusCode: 422,
            statusMessage: "All signatories have already signed — contract cannot be reopened",
        });
    }

    await prisma.$transaction(async (tx) => {
        await tx.contract.update({
            where: { id: contractId },
            data: { status: "SENT_FOR_SIGNING" },
        });

        await tx.contractAuditLog.create({
            data: {
                contractId,
                actorUserId: ctx.userId,
                eventType: "STATUS_CHANGED",
                details: JSON.stringify({
                    from: "ACTIVE",
                    to: "SENT_FOR_SIGNING",
                    reason: "Reopened for signing — not all signatories had signed",
                    totalParties,
                    signedCount,
                    unsignedCount: totalParties - signedCount,
                }),
            },
        });
    });

    return { success: true, status: "SENT_FOR_SIGNING" };
});
