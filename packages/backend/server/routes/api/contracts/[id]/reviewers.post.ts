import { prisma } from "../../../../db";
import { requirePermission, PERMISSIONS } from "../../../../utils/permissions";
import type { AssignReviewersBody } from "../../../../types/contracts";

export default defineEventHandler(async (event) => {
    const ctx = await requirePermission(event, PERMISSIONS.APPROVE_CONTRACTS);
    const contractId = getRouterParam(event, "id");

    if (!contractId) {
        throw createError({ statusCode: 400, statusMessage: "Contract ID required" });
    }

    const body = (await readBody(event)) as AssignReviewersBody;
    if (!Array.isArray(body?.approverIds) || body.approverIds.length === 0) {
        throw createError({ statusCode: 400, statusMessage: "approverIds must be a non-empty array" });
    }

    const contract = await prisma.contract.findFirst({
        where: { id: contractId, organizationId: ctx.organizationId },
    });

    if (!contract) {
        throw createError({ statusCode: 404, statusMessage: "Contract not found" });
    }

    if (contract.status !== "REVIEW") {
        throw createError({ statusCode: 422, statusMessage: "Reviewers can only be assigned to contracts in REVIEW status" });
    }

    // Validate all approvers are org members
    const memberships = await prisma.organizationMember.findMany({
        where: { organizationId: ctx.organizationId, userId: { in: body.approverIds } },
        select: { userId: true },
    });

    const validIds = new Set(memberships.map((m) => m.userId));
    const invalidIds = body.approverIds.filter((id) => !validIds.has(id));
    if (invalidIds.length > 0) {
        throw createError({ statusCode: 400, statusMessage: `Users not found in organisation: ${invalidIds.join(", ")}` });
    }

    const workflow = body.workflow === "SEQUENTIAL" ? "SEQUENTIAL" : "SIMULTANEOUS";

    // Replace all existing approvals with the new set
    await prisma.$transaction(async (tx) => {
        await tx.contractApproval.deleteMany({ where: { contractId } });

        for (let i = 0; i < body.approverIds!.length; i++) {
            await tx.contractApproval.create({
                data: {
                    contractId,
                    approverId: body.approverIds![i],
                    order: i,
                    status: "PENDING",
                },
            });
        }

        await tx.contract.update({
            where: { id: contractId },
            data: { approvalWorkflow: workflow },
        });

        await tx.contractAuditLog.create({
            data: {
                contractId,
                actorUserId: ctx.userId,
                eventType: "REVIEWERS_ASSIGNED",
                details: JSON.stringify({
                    approverIds: body.approverIds,
                    workflow,
                }),
            },
        });
    });

    return { success: true, workflow, assignedCount: body.approverIds.length };
});
