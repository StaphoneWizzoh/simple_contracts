import { prisma } from "../../../db";
import { getOrgContext } from "../../../utils/permissions";

export default defineEventHandler(async (event) => {
    const ctx = await getOrgContext(event);

    const templates = await prisma.contractTemplate.findMany({
        where: {
            organizationId: ctx.organizationId,
            isActive: true,
        },
        select: {
            id: true,
            title: true,
            description: true,
            contractType: true,
            createdByUser: { select: { name: true } },
            createdAt: true,
        },
        orderBy: { createdAt: "desc" },
    });

    return { templates };
});
