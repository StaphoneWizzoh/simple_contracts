import { prisma } from "../../../../db";
import { requirePermission, PERMISSIONS } from "../../../../utils/permissions";
import { assertTransition } from "../../../../utils/contractStatus";
import type { TerminateBody } from "../../../../types/contracts";

export default defineEventHandler(async (event) => {
    const ctx = await requirePermission(event, PERMISSIONS.MANAGE_ORG);
    const contractId = getRouterParam(event, "id");

    if (!contractId) {
        throw createError({ statusCode: 400, statusMessage: "Contract ID required" });
    }

    const body = (await readBody(event)) as TerminateBody;

    const contract = await prisma.contract.findFirst({
        where: { id: contractId, organizationId: ctx.organizationId },
    });

    if (!contract) {
        throw createError({ statusCode: 404, statusMessage: "Contract not found" });
    }

    assertTransition(contract.status, "TERMINATED");

    const now = new Date();

    await prisma.$transaction(async (tx) => {
        await tx.contract.update({
            where: { id: contractId },
            data: {
                status: "TERMINATED",
                terminatedAt: now,
                terminationReason: body.reason ?? null,
            },
        });

        await tx.contractAuditLog.create({
            data: {
                contractId,
                actorUserId: ctx.userId,
                eventType: "STATUS_CHANGED",
                details: JSON.stringify({
                    from: "ACTIVE",
                    to: "TERMINATED",
                    reason: body.reason ?? null,
                }),
            },
        });
    });

    return { success: true, status: "TERMINATED", terminatedAt: now };
});
