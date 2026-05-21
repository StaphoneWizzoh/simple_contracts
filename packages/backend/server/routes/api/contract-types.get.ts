import { prisma } from "../../db";
import { getOrgContext } from "../../utils/permissions";

export default defineEventHandler(async (event) => {
    const ctx = await getOrgContext(event);

    const types = await prisma.contract.findMany({
        where: { organizationId: ctx.organizationId },
        distinct: ["contractType"],
        select: { contractType: true },
        orderBy: { contractType: "asc" },
    });

    return { types: types.map((t) => t.contractType).filter((t) => t && t !== "OTHER") };
});
