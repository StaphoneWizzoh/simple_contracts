import { prisma } from "../../../../db";
import { getOrgContext } from "../../../../utils/permissions";

export default defineEventHandler(async (event) => {
    const ctx = await getOrgContext(event);

    const roles = await prisma.orgRole.findMany({
        where: { organizationId: ctx.organizationId },
        orderBy: { createdAt: "asc" },
        include: { _count: { select: { members: true } } },
    });

    return {
        roles: roles.map((r) => ({
            id: r.id,
            name: r.name,
            description: r.description,
            permissions: JSON.parse(r.permissions) as string[],
            isSystemRole: r.isSystemRole,
            memberCount: r._count.members,
        })),
    };
});
