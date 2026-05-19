import { prisma } from "../../../db";
import { getOrgContext } from "../../../utils/permissions";

export default defineEventHandler(async (event) => {
    const ctx = await getOrgContext(event);

    const searches = await prisma.savedSearch.findMany({
        where: { organizationId: ctx.organizationId, userId: ctx.userId },
        orderBy: { createdAt: "desc" },
    });

    return {
        savedSearches: searches.map((s) => ({
            id: s.id,
            name: s.name,
            filters: JSON.parse(s.filters),
            createdAt: s.createdAt,
        })),
    };
});
