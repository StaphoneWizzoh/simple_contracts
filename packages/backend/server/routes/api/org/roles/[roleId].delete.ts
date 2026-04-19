import { prisma } from "../../../../db";
import { requirePermission, PERMISSIONS } from "../../../../utils/permissions";

export default defineEventHandler(async (event) => {
    const ctx = await requirePermission(event, PERMISSIONS.MANAGE_ROLES);
    const roleId = getRouterParam(event, "roleId");

    if (!roleId) throw createError({ statusCode: 400, statusMessage: "Role ID required" });

    const role = await prisma.orgRole.findFirst({
        where: { id: roleId, organizationId: ctx.organizationId },
        include: { _count: { select: { members: true } } },
    });
    if (!role) throw createError({ statusCode: 404, statusMessage: "Role not found" });
    if (role.isSystemRole) throw createError({ statusCode: 400, statusMessage: "System roles cannot be deleted" });
    if (role._count.members > 0) {
        throw createError({ statusCode: 400, statusMessage: "Cannot delete a role that has members. Reassign them first." });
    }

    await prisma.orgRole.delete({ where: { id: roleId } });

    return { success: true };
});
