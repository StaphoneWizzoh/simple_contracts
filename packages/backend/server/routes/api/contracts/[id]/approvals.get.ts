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
        select: { id: true, status: true, approvalWorkflow: true },
    });

    if (!contract) {
        throw createError({ statusCode: 404, statusMessage: "Contract not found" });
    }

    const approvals = await prisma.contractApproval.findMany({
        where: { contractId },
        include: {
            approver: { select: { id: true, name: true, email: true, image: true } },
        },
        orderBy: { order: "asc" },
    });

    return {
        approvalWorkflow: contract.approvalWorkflow,
        approvals: approvals.map((a) => ({
            id: a.id,
            approverId: a.approverId,
            approverName: a.approver.name,
            approverEmail: a.approver.email,
            approverImage: a.approver.image,
            order: a.order,
            status: a.status,
            comment: a.comment,
            actedAt: a.actedAt,
            createdAt: a.createdAt,
        })),
    };
});
