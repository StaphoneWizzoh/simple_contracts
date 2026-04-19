import { prisma } from "../../../../db";
import { requirePermission, PERMISSIONS, ALL_PERMISSIONS } from "../../../../utils/permissions";

export default defineEventHandler(async (event) => {
    const ctx = await requirePermission(event, PERMISSIONS.MANAGE_ROLES);
    const roleId = getRouterParam(event, "roleId");
    const body = await readBody(event) as { name?: string; description?: string; permissions?: string[] };

    if (!roleId) throw createError({ statusCode: 400, statusMessage: "Role ID required" });

    const role = await prisma.orgRole.findFirst({
        where: { id: roleId, organizationId: ctx.organizationId },
    });
    if (!role) throw createError({ statusCode: 404, statusMessage: "Role not found" });

    const invalidPerms = (body.permissions ?? []).filter((p) => !ALL_PERMISSIONS.includes(p as never));
    if (invalidPerms.length) {
        throw createError({ statusCode: 400, statusMessage: `Invalid permissions: ${invalidPerms.join(", ")}` });
    }

    const updated = await prisma.orgRole.update({
        where: { id: roleId },
        data: {
            name: body.name?.trim() ?? role.name,
            description: body.description?.trim() ?? role.description,
            permissions: body.permissions !== undefined ? JSON.stringify(body.permissions) : role.permissions,
        },
    });

    return {
        role: {
            id: updated.id,
            name: updated.name,
            description: updated.description,
            permissions: JSON.parse(updated.permissions) as string[],
            isSystemRole: updated.isSystemRole,
        },
    };
});
