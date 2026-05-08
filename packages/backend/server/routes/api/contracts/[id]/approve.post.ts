import { prisma } from "../../../../db";
import { getOrgContext } from "../../../../utils/permissions";
import type { ApproveBody } from "../../../../types/contracts";

export default defineEventHandler(async (event) => {
    const ctx = await getOrgContext(event);
    const contractId = getRouterParam(event, "id");

    if (!contractId) {
        throw createError({ statusCode: 400, statusMessage: "Contract ID required" });
    }

    const body = (await readBody(event)) as ApproveBody;

    const contract = await prisma.contract.findFirst({
        where: { id: contractId, organizationId: ctx.organizationId },
        include: {
            approvals: { orderBy: { order: "asc" } },
        },
    });

    if (!contract) {
        throw createError({ statusCode: 404, statusMessage: "Contract not found" });
    }

    if (contract.status !== "REVIEW") {
        throw createError({ statusCode: 422, statusMessage: "Only contracts in REVIEW status can be approved" });
    }

    const myApproval = contract.approvals.find(
        (a) => a.approverId === ctx.userId && a.status === "PENDING",
    );

    if (!myApproval) {
        throw createError({ statusCode: 403, statusMessage: "You are not assigned as a pending approver for this contract" });
    }

    // For sequential workflow: ensure all prior approvals are done
    if (contract.approvalWorkflow === "SEQUENTIAL") {
        const blockers = contract.approvals.filter(
            (a) => a.order < myApproval.order && a.status === "PENDING",
        );
        if (blockers.length > 0) {
            throw createError({ statusCode: 422, statusMessage: "Previous approvers have not yet acted — sequential approval is required" });
        }
    }

    await prisma.$transaction(async (tx) => {
        await tx.contractApproval.update({
            where: { id: myApproval.id },
            data: { status: "APPROVED", comment: body.comment ?? null, actedAt: new Date() },
        });

        await tx.contractAuditLog.create({
            data: {
                contractId,
                actorUserId: ctx.userId,
                eventType: "APPROVAL_SUBMITTED",
                details: JSON.stringify({ action: "APPROVED", comment: body.comment ?? null }),
            },
        });
    });

    return { success: true, action: "APPROVED" };
});
