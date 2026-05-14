import { prisma } from "../../../db";
import { getOrgContext } from "../../../utils/permissions";

export default defineEventHandler(async (event) => {
    const ctx = await getOrgContext(event);
    const templateId = getRouterParam(event, "id");

    if (!templateId) {
        throw createError({ statusCode: 400, statusMessage: "Template ID required" });
    }

    const template = await prisma.contractTemplate.findFirst({
        where: {
            id: templateId,
            organizationId: ctx.organizationId,
        },
    });

    if (!template) {
        throw createError({ statusCode: 404, statusMessage: "Template not found" });
    }

    return {
        template: {
            ...template,
            variables: JSON.parse(template.variables),
        },
    };
});
