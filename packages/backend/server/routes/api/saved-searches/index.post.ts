import { prisma } from "../../../db";
import { getOrgContext } from "../../../utils/permissions";

export default defineEventHandler(async (event) => {
    const ctx = await getOrgContext(event);
    const body = await readBody(event);

    const name = typeof body?.name === "string" ? body.name.trim() : "";
    if (!name) {
        throw createError({ statusCode: 400, statusMessage: "Name is required" });
    }
    if (!body?.filters || typeof body.filters !== "object") {
        throw createError({ statusCode: 400, statusMessage: "Filters object is required" });
    }

    const search = await prisma.savedSearch.create({
        data: {
            organizationId: ctx.organizationId,
            userId: ctx.userId,
            name,
            filters: JSON.stringify(body.filters),
        },
    });

    return {
        savedSearch: {
            id: search.id,
            name: search.name,
            filters: body.filters,
            createdAt: search.createdAt,
        },
    };
});
