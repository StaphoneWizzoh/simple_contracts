import { prisma } from "../../../../db";
import { auth } from "../../../../auth";
import { seedDefaultRoles, getAdminRole } from "../../../../utils/permissions";

export default defineEventHandler(async (event) => {
    const token = getRouterParam(event, "token");
    if (!token) throw createError({ statusCode: 400, statusMessage: "Token required" });

    const session = await auth.api.getSession({ headers: event.node.req.headers });
    if (!session?.user?.id) throw createError({ statusCode: 401, statusMessage: "You must be logged in to accept an invite" });

    const invite = await prisma.orgInvite.findUnique({
        where: { token },
        include: { organization: true, role: true },
    });

    if (!invite) throw createError({ statusCode: 404, statusMessage: "Invite not found" });
    if (invite.status !== "PENDING") {
        throw createError({ statusCode: 410, statusMessage: `Invite is ${invite.status.toLowerCase()}` });
    }
    if (invite.expiresAt < new Date()) {
        await prisma.orgInvite.update({ where: { token }, data: { status: "EXPIRED" } });
        throw createError({ statusCode: 410, statusMessage: "Invite has expired" });
    }

    const userId = session.user.id;
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });

    if (user?.email.toLowerCase() !== invite.email.toLowerCase()) {
        throw createError({ statusCode: 403, statusMessage: "This invite was sent to a different email address" });
    }

    const alreadyMember = await prisma.organizationMember.findFirst({
        where: { organizationId: invite.organizationId, userId },
    });
    if (alreadyMember) throw createError({ statusCode: 409, statusMessage: "You are already a member of this organisation" });

    const existingMemberships = await prisma.organizationMember.count({ where: { userId } });
    if (existingMemberships > 0) {
        throw createError({ statusCode: 400, statusMessage: "You already belong to an organisation. Multi-org support is coming soon." });
    }

    const orgHasRoles = await prisma.orgRole.count({ where: { organizationId: invite.organizationId } });
    if (orgHasRoles === 0) {
        await seedDefaultRoles(invite.organizationId);
    }

    const roleExists = await prisma.orgRole.findFirst({
        where: { id: invite.roleId, organizationId: invite.organizationId },
    });
    const assignRoleId = roleExists ? invite.roleId : (await getAdminRole(invite.organizationId))!.id;

    await prisma.$transaction([
        prisma.organizationMember.create({
            data: { organizationId: invite.organizationId, userId, roleId: assignRoleId },
        }),
        prisma.orgInvite.update({
            where: { token },
            data: { status: "ACCEPTED", acceptedAt: new Date() },
        }),
    ]);

    return { organisationId: invite.organizationId, organisationName: invite.organization.name };
});
