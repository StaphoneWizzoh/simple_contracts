import { prisma } from "../../../db";
import { requirePermission, PERMISSIONS } from "../../../utils/permissions";

interface CreateTemplateBody {
    title: string;
    description?: string;
    contractType?: string;
    contentHtml: string;
    contentJson?: string;
    contentText?: string;
    variables?: Array<{ name: string; label: string; type: string; required?: boolean; defaultValue?: string }>;
}

export default defineEventHandler(async (event) => {
    const ctx = await requirePermission(event, PERMISSIONS.CREATE_TEMPLATES);
    const body = await readBody<CreateTemplateBody>(event);

    if (!body?.title?.trim()) {
        throw createError({ statusCode: 400, statusMessage: "Title is required" });
    }
    if (!body?.contentHtml?.trim()) {
        throw createError({ statusCode: 400, statusMessage: "Content is required" });
    }

    const template = await prisma.contractTemplate.create({
        data: {
            organizationId: ctx.organizationId,
            createdByUserId: ctx.userId,
            title: body.title.trim(),
            description: body.description?.trim() ?? null,
            contractType: body.contractType?.trim() ?? "OTHER",
            contentHtml: body.contentHtml,
            contentJson: body.contentJson ?? null,
            contentText: body.contentText ?? null,
            variables: JSON.stringify(body.variables ?? []),
        },
    });

    return { template };
});
