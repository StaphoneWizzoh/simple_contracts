import { prisma } from "../../../db";

export default defineEventHandler(async (event) => {
    const token = getRouterParam(event, "token");
    if (!token) throw createError({ statusCode: 400, statusMessage: "Token required" });

    const invite = await prisma.orgInvite.findUnique({
        where: { token },
        include: {
            organization: { select: { id: true, name: true } },
            role: { select: { id: true, name: true } },
        },
    });

    if (!invite) throw createError({ statusCode: 404, statusMessage: "Invite not found" });
    if (invite.status !== "PENDING") {
        throw createError({ statusCode: 410, statusMessage: `Invite is ${invite.status.toLowerCase()}` });
    }
    if (invite.expiresAt < new Date()) {
        await prisma.orgInvite.update({ where: { token }, data: { status: "EXPIRED" } });
        throw createError({ statusCode: 410, statusMessage: "Invite has expired" });
    }

    return {
        email: invite.email,
        organisationName: invite.organization.name,
        roleName: invite.role.name,
        expiresAt: invite.expiresAt,
    };
});
