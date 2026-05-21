import { prisma } from "../../../../db";
import { getOrgContext, PERMISSIONS } from "../../../../utils/permissions";
import { requireContractAccess } from "../../../../utils/contractGuards";
import { logContractEvent } from "../../../../utils/auditLog";
import { assertTransition } from "../../../../utils/contractStatus";
import type { RejectBody } from "../../../../types/contracts";

export default defineEventHandler(async (event) => {
    const contractId = getRouterParam(event, "id");

    if (!contractId) {
        throw createError({ statusCode: 400, statusMessage: "Contract ID required" });
    }

    const { ctx, contract } = await requireContractAccess(event, contractId);
    const body = (await readBody(event)) as RejectBody;

    assertTransition(contract.status, "DRAFT");

    // Must be an assigned approver OR hold approve_contracts permission
    const isAssignedApprover = contract.approvals.some((a) => a.approverId === ctx.userId);
    const hasApprovePermission = ctx.permissions.includes(PERMISSIONS.APPROVE_CONTRACTS);

    if (!isAssignedApprover && !hasApprovePermission) {
        throw createError({ statusCode: 403, statusMessage: "Insufficient permissions to reject this contract" });
    }

    await prisma.$transaction(async (tx) => {
        // Cancel all PENDING approvals
        await tx.contractApproval.updateMany({
            where: { contractId, status: "PENDING" },
            data: { status: "REJECTED", comment: body.comment ?? null, actedAt: new Date() },
        });

        await tx.contract.update({
            where: { id: contractId },
            data: { status: "DRAFT" },
        });

        await logContractEvent(
            {
                type: "STATUS_CHANGED",
                transition: "rejected",
                from: "REVIEW",
                to: "DRAFT",
                reason: "rejected",
                comment: body.comment ?? null,
            },
            { contractId, actorUserId: ctx.userId },
            tx,
        );
    });

    return { success: true, status: "DRAFT" };
});
