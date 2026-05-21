import { prisma } from "../../../db";
import { getOrgContext } from "../../../utils/permissions";

export default defineEventHandler(async (event) => {
    const ctx = await getOrgContext(event);
    const id = getRouterParam(event, "id");
    if (!id) throw createError({ statusCode: 400, statusMessage: "ID is required" });

    const search = await prisma.savedSearch.findFirst({
        where: { id, organizationId: ctx.organizationId, userId: ctx.userId },
    });
    if (!search) throw createError({ statusCode: 404, statusMessage: "Saved search not found" });

    await prisma.savedSearch.delete({ where: { id } });
    return { ok: true };
});
