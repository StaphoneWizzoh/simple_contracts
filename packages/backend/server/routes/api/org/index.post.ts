import { auth } from "../../../auth";
import { prisma } from "../../../db";
import { seedDefaultRoles, getAdminRole } from "../../../utils/permissions";
import type { CreateOrgBody } from "../../../types/org";

export default defineEventHandler(async (event) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const session = await auth.api.getSession({ headers: event.node.req.headers as any });
    if (!session?.user?.id) {
        throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
    }

    const userId = session.user.id;

    const existing = await prisma.organizationMember.findFirst({ where: { userId } });
    if (existing) {
        throw createError({ statusCode: 409, statusMessage: "Already a member of an organisation" });
    }

    const body = await readBody(event) as CreateOrgBody;
    if (!body?.name?.trim()) {
        throw createError({ statusCode: 400, statusMessage: "Organisation name is required" });
    }

    const organization = await prisma.organization.create({
        data: { name: body.name.trim(), legalName: body.legalName?.trim() ?? null },
    });

    await seedDefaultRoles(organization.id);
    const adminRole = await getAdminRole(organization.id);

    await prisma.organizationMember.create({
        data: { organizationId: organization.id, userId, roleId: adminRole!.id },
    });

    return { org: { id: organization.id, name: organization.name, legalName: organization.legalName } };
});
