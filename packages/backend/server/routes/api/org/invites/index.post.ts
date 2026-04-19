import { prisma } from "../../../../db";
import { requirePermission, PERMISSIONS } from "../../../../utils/permissions";
import { randomBytes } from "crypto";

export default defineEventHandler(async (event) => {
    const ctx = await requirePermission(event, PERMISSIONS.MANAGE_USERS);
    const body = await readBody(event) as { email?: string; roleId?: string; expiryDays?: number };

    if (!body?.email?.trim()) throw createError({ statusCode: 400, statusMessage: "Email is required" });
    if (!body?.roleId) throw createError({ statusCode: 400, statusMessage: "roleId is required" });

    const email = body.email.trim().toLowerCase();
    const expiryDays = body.expiryDays && body.expiryDays > 0 ? body.expiryDays : 7;

    const role = await prisma.orgRole.findFirst({
        where: { id: body.roleId, organizationId: ctx.organizationId },
    });
    if (!role) throw createError({ statusCode: 404, statusMessage: "Role not found" });

    const alreadyMember = await prisma.organizationMember.findFirst({
        where: { organizationId: ctx.organizationId, user: { email } },
    });
    if (alreadyMember) throw createError({ statusCode: 409, statusMessage: "This user is already a member" });

    await prisma.orgInvite.updateMany({
        where: { organizationId: ctx.organizationId, email, status: "PENDING" },
        data: { status: "REVOKED" },
    });

    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000);

    const invite = await prisma.orgInvite.create({
        data: {
            organizationId: ctx.organizationId,
            email,
            roleId: body.roleId,
            token,
            invitedByUserId: ctx.userId,
            expiresAt,
        },
        include: { role: { select: { name: true } } },
    });

    return {
        invite: {
            id: invite.id,
            email: invite.email,
            roleName: invite.role.name,
            expiresAt: invite.expiresAt,
            token: invite.token,
        },
    };
});
