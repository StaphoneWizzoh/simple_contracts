import { auth } from "../auth";
import { prisma } from "../db";

export const PERMISSIONS = {
    CREATE_CONTRACTS: "create_contracts",
    CREATE_TEMPLATES: "create_templates",
    REVIEW_CONTRACTS: "review_contracts",
    APPROVE_CONTRACTS: "approve_contracts",
    SEND_FOR_SIGNING: "send_for_signing",
    MANAGE_USERS: "manage_users",
    MANAGE_ROLES: "manage_roles",
    VIEW_REPORTS: "view_reports",
    MANAGE_ORG: "manage_org",
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

export const ALL_PERMISSIONS: Permission[] = Object.values(PERMISSIONS);

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

export type OrgContext = {
    userId: string;
    organizationId: string;
    roleId: string;
    permissions: Permission[];
};

type AppEvent = { node: { req: { headers: Record<string, string | string[] | undefined> } } };

export async function requireAuth(event: AppEvent) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const session = await auth.api.getSession({ headers: event.node.req.headers as any });
    if (!session?.user?.id) {
        throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
    }
    return session.user;
}

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

export async function getAdminRole(organizationId: string) {
    return prisma.orgRole.findFirst({
        where: { organizationId, name: "Admin" },
    });
}
