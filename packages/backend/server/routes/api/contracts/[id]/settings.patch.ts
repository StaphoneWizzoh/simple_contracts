import { prisma } from "../../../../db";
import { requirePermission, PERMISSIONS } from "../../../../utils/permissions";
import type { ContractSettingsBody } from "../../../../types/contracts";

const EDITABLE_STATUSES = new Set(["DRAFT", "REVIEW"]);

export default defineEventHandler(async (event) => {
    const ctx = await requirePermission(event, PERMISSIONS.CREATE_CONTRACTS);
    const contractId = getRouterParam(event, "id");

    if (!contractId) {
        throw createError({ statusCode: 400, statusMessage: "Contract ID required" });
    }

    const body = (await readBody(event)) as ContractSettingsBody;

    const contract = await prisma.contract.findFirst({
        where: { id: contractId, organizationId: ctx.organizationId },
    });

    if (!contract) {
        throw createError({ statusCode: 404, statusMessage: "Contract not found" });
    }

    if (!EDITABLE_STATUSES.has(contract.status)) {
        throw createError({
            statusCode: 422,
            statusMessage: "Contract settings can only be updated in DRAFT or REVIEW status",
        });
    }

    const updateData: Record<string, unknown> = {};
    if (body.contractType !== undefined) updateData.contractType = body.contractType;
    if (body.effectiveAt !== undefined) {
        updateData.effectiveAt = body.effectiveAt ? new Date(body.effectiveAt) : null;
    }
    if (body.expiresAt !== undefined) {
        updateData.expiresAt = body.expiresAt ? new Date(body.expiresAt) : null;
    }
    if (body.currencyCode !== undefined) updateData.currencyCode = body.currencyCode;
    if (body.totalValueMinor !== undefined) updateData.totalValueMinor = body.totalValueMinor;
    if (body.approvalWorkflow !== undefined) updateData.approvalWorkflow = body.approvalWorkflow;
    if (body.signingWorkflow !== undefined) updateData.signingWorkflow = body.signingWorkflow;
    if (body.signatureType !== undefined) updateData.signatureType = body.signatureType;
    if (body.signingLinkExpiryDays !== undefined) {
        updateData.signingLinkExpiryDays = body.signingLinkExpiryDays;
    }

    if (Object.keys(updateData).length === 0) {
        return { success: true, message: "No changes" };
    }

    await prisma.$transaction(async (tx) => {
        await tx.contract.update({ where: { id: contractId }, data: updateData });

        await tx.contractAuditLog.create({
            data: {
                contractId,
                actorUserId: ctx.userId,
                eventType: "SETTINGS_UPDATED",
                details: JSON.stringify(updateData),
            },
        });
    });

    return { success: true };
});
