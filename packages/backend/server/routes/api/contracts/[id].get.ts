import { auth } from "../../../auth";
import { prisma } from "../../../db";

export default defineEventHandler(async (event) => {
    const session = await auth.api.getSession({
        headers: event.node.req.headers,
    });

    if (!session?.user?.id) {
        throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
    }

    const userId = session.user.id;
    const contractId = getRouterParam(event, "id");

    if (!contractId) {
        throw createError({ statusCode: 400, statusMessage: "Contract ID required" });
    }

    const membership = await prisma.organizationMember.findFirst({
        where: { userId },
    });

    if (!membership) {
        throw createError({ statusCode: 404, statusMessage: "Contract not found" });
    }

    const contract = await prisma.contract.findFirst({
        where: {
            id: contractId,
            organizationId: membership.organizationId,
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
        title: contract.title,
        description: contract.description,
        status: contract.status,
        counterpartyName: contract.counterpartyName,
        contentHtml: contract.currentVersion?.contentHtml ?? "",
        versionNumber: contract.currentVersion?.versionNumber ?? 1,
        updatedAt: contract.updatedAt,
    };
});
