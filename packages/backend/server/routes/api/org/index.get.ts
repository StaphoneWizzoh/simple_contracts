import { prisma } from "../../../db";
import { getOrgContext } from "../../../utils/permissions";

export default defineEventHandler(async (event) => {
    const ctx = await getOrgContext(event);

    const org = await prisma.organization.findUnique({
        where: { id: ctx.organizationId },
        select: { id: true, name: true, legalName: true, logoUrl: true, createdAt: true },
    });

    if (!org) throw createError({ statusCode: 404, statusMessage: "Organisation not found" });

    return { org, permissions: ctx.permissions };
});
