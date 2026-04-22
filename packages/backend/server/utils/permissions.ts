import { auth } from "../auth";
import { prisma } from "../db";

/**
 * All permission keys available in the system.
 * Permissions are stored as a JSON string array on the `OrgRole` database record.
 */
export const PERMISSIONS = {
    /** Create, edit, and save contract drafts. */
    CREATE_CONTRACTS: "create_contracts",
    /** Create and manage contract templates. */
    CREATE_TEMPLATES: "create_templates",
    /** Be assigned as a contract reviewer. */
    REVIEW_CONTRACTS: "review_contracts",
    /** Approve or reject contracts in the review stage. */
    APPROVE_CONTRACTS: "approve_contracts",
    /** Send a contract to external signatories. */
    SEND_FOR_SIGNING: "send_for_signing",
    /** Invite, remove, and reassign organisation members. */
    MANAGE_USERS: "manage_users",
    /** Create, edit, and delete custom roles. */
    MANAGE_ROLES: "manage_roles",
    /** Access the reporting dashboard. */
    VIEW_REPORTS: "view_reports",
    /** Edit organisation name, legal name, and settings. */
    MANAGE_ORG: "manage_org",
} as const;

/** Union of all valid permission string values. */
export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

/** Array of every permission value — used when seeding the Admin role. */
export const ALL_PERMISSIONS: Permission[] = Object.values(PERMISSIONS);

/**
 * Default roles seeded for every new organisation.
 * System roles cannot be deleted via the API.
 */
export const DEFAULT_ROLES = [
    {
        name: "Admin",
        description: "Full access to all organisation features",
        permissions: ALL_PERMISSIONS,
        isSystemRole: true,
    },
    {
        name: "Contract Manager",
        description: "Create and manage contracts, templates, reviews, approvals and signing",
        permissions: [
            PERMISSIONS.CREATE_CONTRACTS,
            PERMISSIONS.CREATE_TEMPLATES,
            PERMISSIONS.REVIEW_CONTRACTS,
            PERMISSIONS.APPROVE_CONTRACTS,
            PERMISSIONS.SEND_FOR_SIGNING,
            PERMISSIONS.VIEW_REPORTS,
        ],
        isSystemRole: true,
    },
    {
        name: "Contract Creator",
        description: "Create and edit contracts from templates",
        permissions: [PERMISSIONS.CREATE_CONTRACTS],
        isSystemRole: true,
    },
    {
        name: "Viewer",
        description: "Read-only access to contracts",
        permissions: [] as Permission[],
        isSystemRole: true,
    },
] as const;

/**
 * Resolved context for an authenticated, org-member request.
 * Returned by {@link getOrgContext} and {@link requirePermission}.
 */
export type OrgContext = {
    /** The authenticated user's ID. */
    userId: string;
    /** The organisation the user belongs to. */
    organizationId: string;
    /** The user's current role ID within the organisation. */
    roleId: string;
    /** The set of permission keys the user holds. */
    permissions: Permission[];
};

/** Minimal event shape accepted by auth/permission helpers. */
type AppEvent = { node: { req: { headers: Record<string, string | string[] | undefined> } } };

/**
 * Verify that the request has a valid session.
 *
 * @param event - The Nitro/H3 event object.
 * @returns The authenticated user.
 * @throws 401 if no valid session is found.
 */
export async function requireAuth(event: AppEvent) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const session = await auth.api.getSession({ headers: event.node.req.headers as any });
    if (!session?.user?.id) {
        throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
    }
    return session.user;
}

/**
 * Resolve the organisation context for the calling user.
 *
 * Validates that the request:
 * 1. Has a valid Better Auth session.
 * 2. Belongs to at least one organisation.
 *
 * @param event - The Nitro/H3 event object.
 * @returns Resolved {@link OrgContext} (userId, organizationId, roleId, permissions).
 * @throws 401 if no valid session exists.
 * @throws 403 if the user is not a member of any organisation.
 *
 * @example
 * ```ts
 * export default defineEventHandler(async (event) => {
 *   const ctx = await getOrgContext(event);
 *   const contracts = await prisma.contract.findMany({
 *     where: { organizationId: ctx.organizationId },
 *   });
 *   return { contracts };
 * });
 * ```
 */
export async function getOrgContext(event: AppEvent): Promise<OrgContext> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const session = await auth.api.getSession({ headers: event.node.req.headers as any });
    if (!session?.user?.id) {
        throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
    }

    const membership = await prisma.organizationMember.findFirst({
        where: { userId: session.user.id },
        include: { role: true },
    });

    if (!membership) {
        throw createError({ statusCode: 403, statusMessage: "Not a member of any organisation" });
    }

    const permissions = JSON.parse(membership.role.permissions) as Permission[];

    return {
        userId: session.user.id,
        organizationId: membership.organizationId,
        roleId: membership.roleId,
        permissions,
    };
}

/**
 * Resolve the organisation context **and** assert the caller holds a specific permission.
 *
 * @param event - The Nitro/H3 event object.
 * @param permission - The {@link Permission} key that must be present.
 * @returns Resolved {@link OrgContext} if the check passes.
 * @throws 401 if no valid session exists.
 * @throws 403 if the user has no organisation, or lacks the required permission.
 *
 * @example
 * ```ts
 * export default defineEventHandler(async (event) => {
 *   const ctx = await requirePermission(event, PERMISSIONS.MANAGE_ORG);
 *   // safe to proceed — caller has manage_org
 * });
 * ```
 */
export async function requirePermission(
    event: AppEvent,
    permission: Permission,
): Promise<OrgContext> {
    const ctx = await getOrgContext(event);
    if (!ctx.permissions.includes(permission)) {
        throw createError({ statusCode: 403, statusMessage: "Insufficient permissions" });
    }
    return ctx;
}

/**
 * Create the four default system roles for a newly created organisation.
 * Should be called immediately after `prisma.organization.create`.
 *
 * @param organizationId - The ID of the newly created organisation.
 * @returns Array of created `OrgRole` records.
 */
export async function seedDefaultRoles(organizationId: string) {
    const roles = await Promise.all(
        DEFAULT_ROLES.map((r) =>
            prisma.orgRole.create({
                data: {
                    organizationId,
                    name: r.name,
                    description: r.description,
                    permissions: JSON.stringify(r.permissions),
                    isSystemRole: r.isSystemRole,
                },
            }),
        ),
    );
    return roles;
}

/**
 * Retrieve the Admin role for a given organisation.
 * Used after {@link seedDefaultRoles} to assign the creating user as Admin.
 *
 * @param organizationId - The organisation to look up.
 * @returns The Admin `OrgRole` record, or `null` if not found.
 */
export async function getAdminRole(organizationId: string) {
    return prisma.orgRole.findFirst({
        where: { organizationId, name: "Admin" },
    });
}
