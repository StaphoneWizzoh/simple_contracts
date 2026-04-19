import { prisma } from "../../../../db";
import { requirePermission, PERMISSIONS } from "../../../../utils/permissions";

export default defineEventHandler(async (event) => {
    const ctx = await requirePermission(event, PERMISSIONS.MANAGE_USERS);

    const invites = await prisma.orgInvite.findMany({
        where: { organizationId: ctx.organizationId, status: "PENDING" },
        include: {
            role: { select: { id: true, name: true } },
            invitedBy: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
    });

    return {
        invites: invites.map((i) => ({
            id: i.id,
            email: i.email,
            roleId: i.roleId,
            roleName: i.role.name,
            invitedBy: i.invitedBy.name,
            expiresAt: i.expiresAt,
            createdAt: i.createdAt,
        })),
    };
});
