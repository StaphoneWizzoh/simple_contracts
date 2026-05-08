import { prisma } from "../../../db";
import { getOrgContext } from "../../../utils/permissions";

export default defineEventHandler(async (event) => {
    const ctx = await getOrgContext(event);
    const contractId = getRouterParam(event, "id");

    if (!contractId) {
        throw createError({ statusCode: 400, statusMessage: "Contract ID required" });
    }

    const contract = await prisma.contract.findFirst({
        where: {
            id: contractId,
            organizationId: ctx.organizationId,
        },
        include: {
            currentVersion: {
                select: {
                    versionNumber: true,
                    contentHtml: true,
                    title: true,
                },
            },
        },
    });

    if (!contract) {
        throw createError({ statusCode: 404, statusMessage: "Contract not found" });
    }

    return {
        id: contract.id,
        contractNumber: contract.contractNumber,
        title: contract.title,
        description: contract.description,
        status: contract.status,
        contractType: contract.contractType,
        counterpartyName: contract.counterpartyName,
        effectiveAt: contract.effectiveAt,
        expiresAt: contract.expiresAt,
        terminatedAt: contract.terminatedAt,
        terminationReason: contract.terminationReason,
        currencyCode: contract.currencyCode,
        totalValueMinor: contract.totalValueMinor,
        approvalWorkflow: contract.approvalWorkflow,
        signingWorkflow: contract.signingWorkflow,
        signatureType: contract.signatureType,
        signingLinkExpiryDays: contract.signingLinkExpiryDays,
        contentHtml: contract.currentVersion?.contentHtml ?? "",
        versionNumber: contract.currentVersion?.versionNumber ?? 1,
        createdAt: contract.createdAt,
        updatedAt: contract.updatedAt,
    };
});
