import { prisma } from "../../../../db";
import { getOrgContext } from "../../../../utils/permissions";

export default defineEventHandler(async (event) => {
    const ctx = await getOrgContext(event);

    const members = await prisma.organizationMember.findMany({
        where: { organizationId: ctx.organizationId },
        include: {
            user: { select: { id: true, name: true, email: true, image: true } },
            role: { select: { id: true, name: true, permissions: true } },
        },
        orderBy: { joinedAt: "asc" },
    });

    return {
        members: members.map((m) => ({
            id: m.id,
            userId: m.userId,
            name: m.user.name,
            email: m.user.email,
            image: m.user.image,
            roleId: m.roleId,
            roleName: m.role.name,
            joinedAt: m.joinedAt,
        })),
    };
});
