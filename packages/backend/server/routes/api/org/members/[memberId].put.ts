import { prisma } from "../../../../db";
import { requirePermission, PERMISSIONS } from "../../../../utils/permissions";
import type { UpdateMemberRoleBody } from "../../../../types/org";

export default defineEventHandler(async (event) => {
    const ctx = await requirePermission(event, PERMISSIONS.MANAGE_USERS);
    const memberId = getRouterParam(event, "memberId");
    const body = await readBody(event) as UpdateMemberRoleBody;

    if (!memberId) throw createError({ statusCode: 400, statusMessage: "Member ID required" });
    if (!body?.roleId) throw createError({ statusCode: 400, statusMessage: "roleId required" });

    const member = await prisma.organizationMember.findFirst({
        where: { id: memberId, organizationId: ctx.organizationId },
    });
    if (!member) throw createError({ statusCode: 404, statusMessage: "Member not found" });

    if (member.userId === ctx.userId) {
        throw createError({ statusCode: 400, statusMessage: "Cannot change your own role" });
    }

    const role = await prisma.orgRole.findFirst({
        where: { id: body.roleId, organizationId: ctx.organizationId },
    });
    if (!role) throw createError({ statusCode: 404, statusMessage: "Role not found" });

    const updated = await prisma.organizationMember.update({
        where: { id: memberId },
        data: { roleId: body.roleId },
        include: { role: { select: { id: true, name: true } } },
    });

    return { memberId: updated.id, roleId: updated.roleId, roleName: updated.role.name };
});
