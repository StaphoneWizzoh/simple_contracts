export type CreateOrgBody = {
    name?: string;
    legalName?: string;
};

export type UpdateOrgBody = {
    name?: string;
    legalName?: string;
    logoUrl?: string;
};

export type UpdateMemberRoleBody = {
    roleId?: string;
};

export type CreateRoleBody = {
    name?: string;
    description?: string;
    permissions?: string[];
};

export type UpdateRoleBody = {
    name?: string;
    description?: string;
    permissions?: string[];
};

export type SendInviteBody = {
    email?: string;
    roleId?: string;
    expiryDays?: number;
};
