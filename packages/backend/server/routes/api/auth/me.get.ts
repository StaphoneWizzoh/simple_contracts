import { getOrgContext } from "../../../utils/permissions";
import type { Permission } from "../../../utils/permissions";

export default defineEventHandler(async (event) => {
    const ctx = await getOrgContext(event);

    return {
        userId: ctx.userId,
        organizationId: ctx.organizationId,
        roleId: ctx.roleId,
        permissions: ctx.permissions as Permission[],
    };
});
