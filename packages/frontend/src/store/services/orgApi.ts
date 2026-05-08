import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { OrgRole, OrgMember, OrgInvite, Organisation, InviteDetails } from "@/types/org";

export type { OrgRole, OrgMember, OrgInvite, Organisation, InviteDetails };

export const orgApi = createApi({
    reducerPath: "orgApi",
    baseQuery: fetchBaseQuery({ baseUrl: "/api", credentials: "include" }),
    tagTypes: ["Org", "Members", "Roles", "Invites"],
    endpoints: (builder) => ({
        getOrg: builder.query<{ org: Organisation; permissions: string[] }, void>({
            query: () => "/org",
            providesTags: ["Org"],
        }),
        createOrg: builder.mutation<{ org: Organisation }, { name: string; legalName?: string }>({
            query: (body) => ({ url: "/org", method: "POST", body }),
            invalidatesTags: ["Org"],
        }),
        updateOrg: builder.mutation<{ org: Organisation }, { name: string; legalName?: string; logoUrl?: string }>({
            query: (body) => ({ url: "/org", method: "PUT", body }),
            invalidatesTags: ["Org"],
        }),
        getMembers: builder.query<{ members: OrgMember[] }, void>({
            query: () => "/org/members",
            providesTags: ["Members"],
        }),
        updateMemberRole: builder.mutation<{ memberId: string; roleId: string; roleName: string }, { memberId: string; roleId: string }>({
            query: ({ memberId, roleId }) => ({ url: `/org/members/${memberId}`, method: "PUT", body: { roleId } }),
            invalidatesTags: ["Members"],
        }),
        removeMember: builder.mutation<{ success: boolean }, string>({
            query: (memberId) => ({ url: `/org/members/${memberId}`, method: "DELETE" }),
            invalidatesTags: ["Members"],
        }),
        getRoles: builder.query<{ roles: OrgRole[] }, void>({
            query: () => "/org/roles",
            providesTags: ["Roles"],
        }),
        createRole: builder.mutation<{ role: OrgRole }, { name: string; description?: string; permissions: string[] }>({
            query: (body) => ({ url: "/org/roles", method: "POST", body }),
            invalidatesTags: ["Roles"],
        }),
        updateRole: builder.mutation<{ role: OrgRole }, { roleId: string; name?: string; description?: string; permissions?: string[] }>({
            query: ({ roleId, ...body }) => ({ url: `/org/roles/${roleId}`, method: "PUT", body }),
            invalidatesTags: ["Roles"],
        }),
        deleteRole: builder.mutation<{ success: boolean }, string>({
            query: (roleId) => ({ url: `/org/roles/${roleId}`, method: "DELETE" }),
            invalidatesTags: ["Roles"],
        }),
        getInvites: builder.query<{ invites: OrgInvite[] }, void>({
            query: () => "/org/invites",
            providesTags: ["Invites"],
        }),
        sendInvite: builder.mutation<{ invite: { id: string; email: string; roleName: string; expiresAt: string; token: string } }, { email: string; roleId: string; expiryDays?: number }>({
            query: (body) => ({ url: "/org/invites", method: "POST", body }),
            invalidatesTags: ["Invites"],
        }),
        revokeInvite: builder.mutation<{ success: boolean }, string>({
            query: (inviteId) => ({ url: `/org/invites/${inviteId}`, method: "DELETE" }),
            invalidatesTags: ["Invites"],
        }),
        getInviteDetails: builder.query<InviteDetails, string>({
            query: (token) => `/invites/${token}`,
        }),
        acceptInvite: builder.mutation<{ organisationId: string; organisationName: string }, string>({
            query: (token) => ({ url: `/invites/${token}/accept`, method: "POST" }),
            invalidatesTags: ["Org", "Members"],
        }),
    }),
});

export const {
    useGetOrgQuery,
    useCreateOrgMutation,
    useUpdateOrgMutation,
    useGetMembersQuery,
    useUpdateMemberRoleMutation,
    useRemoveMemberMutation,
    useGetRolesQuery,
    useCreateRoleMutation,
    useUpdateRoleMutation,
    useDeleteRoleMutation,
    useGetInvitesQuery,
    useSendInviteMutation,
    useRevokeInviteMutation,
    useGetInviteDetailsQuery,
    useAcceptInviteMutation,
} = orgApi;

export const ALL_PERMISSIONS = [
    { key: "create_contracts", label: "Create Contracts" },
    { key: "create_templates", label: "Create Templates" },
    { key: "review_contracts", label: "Review Contracts" },
    { key: "approve_contracts", label: "Approve Contracts" },
    { key: "send_for_signing", label: "Send for Signing" },
    { key: "manage_users", label: "Manage Users" },
    { key: "manage_roles", label: "Manage Roles" },
    { key: "view_reports", label: "View Reports" },
    { key: "manage_org", label: "Manage Organisation" },
] as const;
