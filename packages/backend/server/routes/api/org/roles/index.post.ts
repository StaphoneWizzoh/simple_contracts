import { prisma } from "../../../../db";
import { requirePermission, PERMISSIONS, ALL_PERMISSIONS } from "../../../../utils/permissions";

export default defineEventHandler(async (event) => {
    const ctx = await requirePermission(event, PERMISSIONS.MANAGE_ROLES);
    const body = await readBody(event) as { name?: string; description?: string; permissions?: string[] };

    if (!body?.name?.trim()) throw createError({ statusCode: 400, statusMessage: "Role name is required" });

    const invalidPerms = (body.permissions ?? []).filter((p) => !ALL_PERMISSIONS.includes(p as never));
    if (invalidPerms.length) {
        throw createError({ statusCode: 400, statusMessage: `Invalid permissions: ${invalidPerms.join(", ")}` });
    }

    const existing = await prisma.orgRole.findFirst({
        where: { organizationId: ctx.organizationId, name: body.name.trim() },
    });
    if (existing) throw createError({ statusCode: 409, statusMessage: "A role with that name already exists" });

    const role = await prisma.orgRole.create({
        data: {
            organizationId: ctx.organizationId,
            name: body.name.trim(),
            description: body.description?.trim() ?? null,
            permissions: JSON.stringify(body.permissions ?? []),
            isSystemRole: false,
        },
    });

    return {
        role: {
            id: role.id,
            name: role.name,
            description: role.description,
            permissions: JSON.parse(role.permissions) as string[],
            isSystemRole: role.isSystemRole,
        },
    };
});
