export type OrgRole = {
    id: string;
    name: string;
    description: string | null;
    permissions: string[];
    isSystemRole: boolean;
    memberCount?: number;
};

export type OrgMember = {
    id: string;
    userId: string;
    name: string;
    email: string;
    image: string | null;
    roleId: string;
    roleName: string;
    joinedAt: string;
};

export type OrgInvite = {
    id: string;
    email: string;
    roleId: string;
    roleName: string;
    invitedBy: string;
    expiresAt: string;
    createdAt: string;
};

export type Organisation = {
    id: string;
    name: string;
    legalName: string | null;
    logoUrl: string | null;
    createdAt: string;
};

export type InviteDetails = {
    email: string;
    organisationName: string;
    roleName: string;
    expiresAt: string;
};
