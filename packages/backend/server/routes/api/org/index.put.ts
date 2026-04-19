import { prisma } from "../../../db";
import { requirePermission, PERMISSIONS } from "../../../utils/permissions";

export default defineEventHandler(async (event) => {
    const ctx = await requirePermission(event, PERMISSIONS.MANAGE_ORG);
    const body = await readBody(event) as { name?: string; legalName?: string; logoUrl?: string };

    if (!body?.name?.trim()) {
        throw createError({ statusCode: 400, statusMessage: "Organisation name is required" });
    }

    const org = await prisma.organization.update({
        where: { id: ctx.organizationId },
        data: {
            name: body.name.trim(),
            legalName: body.legalName?.trim() ?? null,
            logoUrl: body.logoUrl?.trim() ?? null,
        },
        select: { id: true, name: true, legalName: true, logoUrl: true, updatedAt: true },
    });

    return { org };
});
