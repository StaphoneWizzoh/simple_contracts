import { prisma } from "../../../db";
import { requirePermission, PERMISSIONS } from "../../../utils/permissions";

export default defineEventHandler(async (event) => {
    const ctx = await requirePermission(event, PERMISSIONS.CREATE_TEMPLATES);
    const templateId = getRouterParam(event, "id");

    if (!templateId) {
        throw createError({ statusCode: 400, statusMessage: "Template ID required" });
    }

    const existing = await prisma.contractTemplate.findFirst({
        where: {
            id: templateId,
            organizationId: ctx.organizationId,
        },
    });

    if (!existing) {
        throw createError({ statusCode: 404, statusMessage: "Template not found" });
    }

    await prisma.contractTemplate.update({
        where: { id: templateId },
        data: { isActive: false },
    });

    return { success: true };
});
