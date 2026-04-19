import { prisma } from "../../../../db";
import { requirePermission, PERMISSIONS } from "../../../../utils/permissions";

export default defineEventHandler(async (event) => {
    const ctx = await requirePermission(event, PERMISSIONS.MANAGE_USERS);
    const memberId = getRouterParam(event, "memberId");

    if (!memberId) throw createError({ statusCode: 400, statusMessage: "Member ID required" });

    const member = await prisma.organizationMember.findFirst({
        where: { id: memberId, organizationId: ctx.organizationId },
    });
    if (!member) throw createError({ statusCode: 404, statusMessage: "Member not found" });

    if (member.userId === ctx.userId) {
        throw createError({ statusCode: 400, statusMessage: "Cannot remove yourself" });
    }

    await prisma.organizationMember.delete({ where: { id: memberId } });

    return { success: true };
});
