import { prisma } from "../../../../db";
import { requireApprovalAction } from "../../../../utils/contractGuards";
import { logContractEvent } from "../../../../utils/auditLog";
import type { ApproveBody } from "../../../../types/contracts";

export default defineEventHandler(async (event) => {
    const contractId = getRouterParam(event, "id");

    if (!contractId) {
        throw createError({ statusCode: 400, statusMessage: "Contract ID required" });
    }

    const { ctx, myApproval } = await requireApprovalAction(event, contractId);
    const body = (await readBody(event)) as ApproveBody;

    await prisma.$transaction(async (tx) => {
        await tx.contractApproval.update({
            where: { id: myApproval.id },
            data: { status: "APPROVED", comment: body.comment ?? null, actedAt: new Date() },
        });

        await logContractEvent(
            { type: "APPROVAL_SUBMITTED", action: "APPROVED", comment: body.comment ?? null },
            { contractId, actorUserId: ctx.userId },
            tx,
        );
    });

    return { success: true, action: "APPROVED" };
});
