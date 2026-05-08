import { prisma } from "../../../../db";
import { requirePermission, PERMISSIONS } from "../../../../utils/permissions";
import { assertTransition } from "../../../../utils/contractStatus";

export default defineEventHandler(async (event) => {
    const ctx = await requirePermission(event, PERMISSIONS.SEND_FOR_SIGNING);
    const contractId = getRouterParam(event, "id");

    if (!contractId) {
        throw createError({ statusCode: 400, statusMessage: "Contract ID required" });
    }

    const contract = await prisma.contract.findFirst({
        where: { id: contractId, organizationId: ctx.organizationId },
        include: {
            approvals: { where: { status: "PENDING" } },
        },
    });

    if (!contract) {
        throw createError({ statusCode: 404, statusMessage: "Contract not found" });
    }

    assertTransition(contract.status, "SENT_FOR_SIGNING");

    // Block if there are still pending approvals
    if (contract.approvals.length > 0) {
        throw createError({
            statusCode: 422,
            statusMessage: `${contract.approvals.length} approval(s) are still pending`,
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
                details: JSON.stringify({ from: "REVIEW", to: "SENT_FOR_SIGNING" }),
            },
        });
    });

    return { success: true, status: "SENT_FOR_SIGNING" };
});
