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

    const membership = await prisma.organizationMember.findFirst({
        where: { userId },
    });

    if (!membership) {
        return { contracts: [] };
    }

    const contracts = await prisma.contract.findMany({
        where: { organizationId: membership.organizationId },
        include: {
            currentVersion: {
                select: { versionNumber: true },
            },
        },
        orderBy: { updatedAt: "desc" },
    });

    return {
        contracts: contracts.map((c) => ({
            id: c.id,
            title: c.title,
            status: c.status,
            counterpartyName: c.counterpartyName,
            versionNumber: c.currentVersion?.versionNumber ?? 1,
            updatedAt: c.updatedAt,
            createdAt: c.createdAt,
        })),
    };
});
