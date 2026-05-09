import { prisma } from "../../../../db";
import { getOrgContext } from "../../../../utils/permissions";

export default defineEventHandler(async (event) => {
    const ctx = await getOrgContext(event);
    const contractId = getRouterParam(event, "id");

    if (!contractId) throw createError({ statusCode: 400, statusMessage: "Contract ID required" });

    const contract = await prisma.contract.findFirst({
        where: { id: contractId, organizationId: ctx.organizationId },
    });

    if (!contract) throw createError({ statusCode: 404, statusMessage: "Contract not found" });

    const parties = await prisma.contractParty.findMany({
        where: { contractId },
        include: {
            signatures: {
                select: {
                    id: true,
                    status: true,
                    requestedAt: true,
                    viewedAt: true,
                    signedAt: true,
                    declinedAt: true,
                    signatureData: true,
                    signatureType: true,
                    ipAddress: true,
                    signingToken: {
                        select: { expiresAt: true, usedAt: true },
                    },
                },
                orderBy: { requestedAt: "desc" },
                take: 1,
            },
        },
        orderBy: [{ signingOrder: "asc" }, { createdAt: "asc" }],
    });

    return { signatories: parties };
});
