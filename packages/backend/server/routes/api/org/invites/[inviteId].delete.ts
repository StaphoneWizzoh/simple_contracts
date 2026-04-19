import { prisma } from "../../../../db";
import { requirePermission, PERMISSIONS } from "../../../../utils/permissions";

export default defineEventHandler(async (event) => {
    const ctx = await requirePermission(event, PERMISSIONS.MANAGE_USERS);
    const inviteId = getRouterParam(event, "inviteId");

    if (!inviteId) throw createError({ statusCode: 400, statusMessage: "Invite ID required" });

    const invite = await prisma.orgInvite.findFirst({
        where: { id: inviteId, organizationId: ctx.organizationId },
    });
    if (!invite) throw createError({ statusCode: 404, statusMessage: "Invite not found" });

    await prisma.orgInvite.update({
        where: { id: inviteId },
        data: { status: "REVOKED" },
    });

    return { success: true };
});
