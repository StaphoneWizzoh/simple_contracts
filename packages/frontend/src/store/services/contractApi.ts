import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type {
    SaveDraftRequest,
    PublishContractRequest,
    ContractSaveResponse,
    ContractListItem,
    ContractListResponse,
    ContractQueryParams,
    ContractDetail,
    ContractApproval,
    ApprovalsResponse,
    AuditLogEntry,
    ContractSettingsRequest,
    AssignReviewersRequest,
    ApproveRequest,
    RejectRequest,
    TerminateRequest,
    SavedSearch,
    ReportFilters,
    SummaryReport,
    StatusReport,
    TypeReport,
    ExpiringReport,
    TurnaroundReport,
    ApprovalTurnaroundReport,
    CreatorReport,
    OverdueReport,
    ValueSummaryReport,
    RenewalPipelineReport,
} from "@/types/contracts";

export type {
    SaveDraftRequest,
    PublishContractRequest,
    ContractSaveResponse,
    ContractListItem,
    ContractListResponse,
    ContractQueryParams,
    ContractDetail,
    ContractApproval,
    ApprovalsResponse,
    AuditLogEntry,
    ContractSettingsRequest,
    AssignReviewersRequest,
    ApproveRequest,
    RejectRequest,
    TerminateRequest,
    SavedSearch,
    ReportFilters,
    SummaryReport,
    StatusReport,
    TypeReport,
    ExpiringReport,
    TurnaroundReport,
    ApprovalTurnaroundReport,
    CreatorReport,
    OverdueReport,
    ValueSummaryReport,
    RenewalPipelineReport,
};

function toQueryString(params: Record<string, unknown>): string {
    const entries = Object.entries(params).filter(([, v]) => v != null && v !== "");
    if (!entries.length) return "";
    return "?" + entries.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`).join("&");
}

export const contractApi = createApi({
    reducerPath: "contractApi",
    baseQuery: fetchBaseQuery({
        baseUrl: "/api",
        credentials: "include",
    }),
    tagTypes: ["Contract", "Approvals", "AuditLog", "Reports", "SavedSearches", "ContractTypes"],
    endpoints: (builder) => ({
        getContracts: builder.query<ContractListResponse, ContractQueryParams | void>({
            query: (params) => `/contracts${params ? toQueryString(params as Record<string, unknown>) : ""}`,
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

        reopenForSigning: builder.mutation<{ success: boolean; status: string }, string>({
            query: (contractId) => ({
                url: `/contracts/${contractId}/reopen-signing`,
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

        uploadSignedPdf: builder.mutation<{ success: boolean }, { contractId: string; pdfBase64: string }>({
            query: ({ contractId, pdfBase64 }) => ({
                url: `/contracts/${contractId}/signed-pdf`,
                method: "POST",
                body: { pdfBase64 },
            }),
            invalidatesTags: (_r, _e, arg) => [{ type: "Contract", id: arg.contractId }],
        }),

        // ---- Reports ----

        getReportSummary: builder.query<SummaryReport, void>({
            query: () => "/reports/summary",
            providesTags: ["Reports"],
            keepUnusedDataFor: 300,
        }),

        getReportByStatus: builder.query<StatusReport, { months?: number }>({
            query: ({ months } = {}) => `/reports/by-status${months ? `?months=${months}` : ""}`,
            providesTags: ["Reports"],
            keepUnusedDataFor: 300,
        }),

        getReportByType: builder.query<TypeReport, ReportFilters>({
            query: (f) => `/reports/by-type${toQueryString(f as Record<string, unknown>)}`,
            providesTags: ["Reports"],
            keepUnusedDataFor: 300,
        }),

        getExpiringSoon: builder.query<ExpiringReport, { days?: number }>({
            query: ({ days } = {}) => `/reports/expiring-soon${days ? `?days=${days}` : ""}`,
            providesTags: ["Reports"],
            keepUnusedDataFor: 300,
        }),

        getSigningTurnaround: builder.query<TurnaroundReport, ReportFilters>({
            query: (f) => `/reports/signing-turnaround${toQueryString(f as Record<string, unknown>)}`,
            providesTags: ["Reports"],
            keepUnusedDataFor: 300,
        }),

        getApprovalTurnaround: builder.query<ApprovalTurnaroundReport, ReportFilters>({
            query: (f) => `/reports/approval-turnaround${toQueryString(f as Record<string, unknown>)}`,
            providesTags: ["Reports"],
            keepUnusedDataFor: 300,
        }),

        getByCreator: builder.query<CreatorReport, ReportFilters>({
            query: (f) => `/reports/by-creator${toQueryString(f as Record<string, unknown>)}`,
            providesTags: ["Reports"],
            keepUnusedDataFor: 300,
        }),

        getOverdueApprovals: builder.query<OverdueReport, { thresholdDays?: number }>({
            query: ({ thresholdDays } = {}) =>
                `/reports/overdue-approvals${thresholdDays ? `?thresholdDays=${thresholdDays}` : ""}`,
            providesTags: ["Reports"],
            keepUnusedDataFor: 300,
        }),

        getValueSummary: builder.query<ValueSummaryReport, ReportFilters & { contractType?: string }>({
            query: (f) => `/reports/value-summary${toQueryString(f as Record<string, unknown>)}`,
            providesTags: ["Reports"],
            keepUnusedDataFor: 300,
        }),

        getRenewalPipeline: builder.query<RenewalPipelineReport, void>({
            query: () => "/reports/renewal-pipeline",
            providesTags: ["Reports"],
            keepUnusedDataFor: 300,
        }),

        // ---- Saved Searches ----

        getSavedSearches: builder.query<{ savedSearches: SavedSearch[] }, void>({
            query: () => "/saved-searches",
            providesTags: ["SavedSearches"],
        }),

        createSavedSearch: builder.mutation<{ savedSearch: SavedSearch }, { name: string; filters: ContractQueryParams }>({
            query: (body) => ({ url: "/saved-searches", method: "POST", body }),
            invalidatesTags: ["SavedSearches"],
        }),

        deleteSavedSearch: builder.mutation<{ ok: boolean }, string>({
            query: (id) => ({ url: `/saved-searches/${id}`, method: "DELETE" }),
            invalidatesTags: ["SavedSearches"],
        }),

        // ---- Metadata ----

        getContractTypes: builder.query<{ types: string[] }, void>({
            query: () => "/contract-types",
            providesTags: ["ContractTypes"],
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
    useReopenForSigningMutation,
    useTerminateContractMutation,
    useGetAuditLogQuery,
    useUploadSignedPdfMutation,
    useGetReportSummaryQuery,
    useGetReportByStatusQuery,
    useGetReportByTypeQuery,
    useGetExpiringSoonQuery,
    useGetSigningTurnaroundQuery,
    useGetApprovalTurnaroundQuery,
    useGetByCreatorQuery,
    useGetOverdueApprovalsQuery,
    useGetValueSummaryQuery,
    useGetRenewalPipelineQuery,
    useGetSavedSearchesQuery,
    useCreateSavedSearchMutation,
    useDeleteSavedSearchMutation,
    useGetContractTypesQuery,
} = contractApi;
