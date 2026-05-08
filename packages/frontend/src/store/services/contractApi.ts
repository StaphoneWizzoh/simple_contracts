import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type {
    SaveDraftRequest,
    PublishContractRequest,
    ContractSaveResponse,
    ContractListItem,
    ContractDetail,
    ContractApproval,
    ApprovalsResponse,
    AuditLogEntry,
    ContractSettingsRequest,
    AssignReviewersRequest,
    ApproveRequest,
    RejectRequest,
    TerminateRequest,
} from "@/types/contracts";

export type {
    SaveDraftRequest,
    PublishContractRequest,
    ContractSaveResponse,
    ContractListItem,
    ContractDetail,
    ContractApproval,
    ApprovalsResponse,
    AuditLogEntry,
    ContractSettingsRequest,
    AssignReviewersRequest,
    ApproveRequest,
    RejectRequest,
    TerminateRequest,
};

export const contractApi = createApi({
    reducerPath: "contractApi",
    baseQuery: fetchBaseQuery({
        baseUrl: "/api",
        credentials: "include",
    }),
    tagTypes: ["Contract", "Approvals", "AuditLog"],
    endpoints: (builder) => ({
        getContracts: builder.query<{ contracts: ContractListItem[] }, void>({
            query: () => "/contracts",
            providesTags: ["Contract"],
        }),

        getContract: builder.query<ContractDetail, string>({
            query: (id) => `/contracts/${id}`,
            providesTags: (_result, _error, id) => [{ type: "Contract", id }],
        }),

        saveDraft: builder.mutation<ContractSaveResponse, SaveDraftRequest>({
            query: (body) => ({ url: "/contracts/drafts", method: "POST", body }),
            invalidatesTags: ["Contract"],
        }),

        publishContract: builder.mutation<ContractSaveResponse, PublishContractRequest>({
            query: (body) => ({ url: "/contracts/publish", method: "POST", body }),
            invalidatesTags: ["Contract"],
        }),

        updateSettings: builder.mutation<
            { success: boolean },
            { contractId: string } & ContractSettingsRequest
        >({
            query: ({ contractId, ...body }) => ({
                url: `/contracts/${contractId}/settings`,
                method: "PATCH",
                body,
            }),
            invalidatesTags: (_r, _e, arg) => [{ type: "Contract", id: arg.contractId }],
        }),

        getApprovals: builder.query<ApprovalsResponse, string>({
            query: (contractId) => `/contracts/${contractId}/approvals`,
            providesTags: (_r, _e, id) => [{ type: "Approvals", id }],
        }),

        assignReviewers: builder.mutation<{ success: boolean }, AssignReviewersRequest>({
            query: ({ contractId, ...body }) => ({
                url: `/contracts/${contractId}/reviewers`,
                method: "POST",
                body,
            }),
            invalidatesTags: (_r, _e, arg) => [
                { type: "Approvals", id: arg.contractId },
                { type: "Contract", id: arg.contractId },
            ],
        }),

        approveContract: builder.mutation<{ success: boolean }, ApproveRequest>({
            query: ({ contractId, ...body }) => ({
                url: `/contracts/${contractId}/approve`,
                method: "POST",
                body,
            }),
            invalidatesTags: (_r, _e, arg) => [{ type: "Approvals", id: arg.contractId }],
        }),

        rejectContract: builder.mutation<{ success: boolean; status: string }, RejectRequest>({
            query: ({ contractId, ...body }) => ({
                url: `/contracts/${contractId}/reject`,
                method: "POST",
                body,
            }),
            invalidatesTags: (_r, _e, arg) => [
                { type: "Approvals", id: arg.contractId },
                { type: "Contract", id: arg.contractId },
                "Contract",
            ],
        }),

        sendForSigning: builder.mutation<{ success: boolean; status: string }, string>({
            query: (contractId) => ({
                url: `/contracts/${contractId}/send-for-signing`,
                method: "POST",
            }),
            invalidatesTags: (_r, _e, id) => [{ type: "Contract", id }, "Contract"],
        }),

        terminateContract: builder.mutation<{ success: boolean; status: string }, TerminateRequest>({
            query: ({ contractId, ...body }) => ({
                url: `/contracts/${contractId}/terminate`,
                method: "POST",
                body,
            }),
            invalidatesTags: (_r, _e, arg) => [
                { type: "Contract", id: arg.contractId },
                "Contract",
            ],
        }),

        getAuditLog: builder.query<{ auditLog: AuditLogEntry[] }, string>({
            query: (contractId) => `/contracts/${contractId}/audit`,
            providesTags: (_r, _e, id) => [{ type: "AuditLog", id }],
        }),
    }),
});

export const {
    useGetContractsQuery,
    useGetContractQuery,
    useSaveDraftMutation,
    usePublishContractMutation,
    useUpdateSettingsMutation,
    useGetApprovalsQuery,
    useAssignReviewersMutation,
    useApproveContractMutation,
    useRejectContractMutation,
    useSendForSigningMutation,
    useTerminateContractMutation,
    useGetAuditLogQuery,
} = contractApi;
