import { prisma } from "../../../db";
import { getOrgContext } from "../../../utils/permissions";

export default defineEventHandler(async (event) => {
    const ctx = await getOrgContext(event);

    const contracts = await prisma.contract.findMany({
        where: { organizationId: ctx.organizationId },
        include: { currentVersion: { select: { versionNumber: true } } },
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
