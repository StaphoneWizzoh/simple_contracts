import { prisma } from "../../../db";
import { requirePermission, PERMISSIONS } from "../../../utils/permissions";

interface UpdateTemplateBody {
    title?: string;
    description?: string;
    contractType?: string;
    contentHtml?: string;
    contentJson?: string;
    contentText?: string;
    variables?: Array<{ name: string; label: string; type: string; required?: boolean; defaultValue?: string }>;
}

export default defineEventHandler(async (event) => {
    const ctx = await requirePermission(event, PERMISSIONS.CREATE_TEMPLATES);
    const templateId = getRouterParam(event, "id");
    const body = await readBody<UpdateTemplateBody>(event);

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

    const updated = await prisma.contractTemplate.update({
        where: { id: templateId },
        data: {
            title: body.title?.trim() ?? existing.title,
            description: body.description?.trim() ?? existing.description,
            contractType: body.contractType?.trim() ?? existing.contractType,
            contentHtml: body.contentHtml ?? existing.contentHtml,
            contentJson: body.contentJson ?? existing.contentJson,
            contentText: body.contentText ?? existing.contentText,
            variables: body.variables ? JSON.stringify(body.variables) : existing.variables,
        },
    });

    return { template: updated };
});
