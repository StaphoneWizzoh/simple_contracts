import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export type SaveDraftRequest = {
    contractId?: string;
    title: string;
    description?: string;
    counterpartyName?: string;
    contentHtml: string;
};

export type PublishContractRequest = SaveDraftRequest;

export type ContractSaveResponse = {
    contractId: string;
    versionId: string;
    versionNumber: number;
    status: string;
};

export type ContractListItem = {
    id: string;
    title: string;
    status: string;
    counterpartyName: string | null;
    versionNumber: number;
    updatedAt: string;
    createdAt: string;
};

export type ContractDetail = {
    id: string;
    contractNumber: string | null;
    title: string;
    description: string | null;
    status: string;
    contractType: string | null;
    counterpartyName: string | null;
    effectiveAt: string | null;
    expiresAt: string | null;
    contentHtml: string;
    versionNumber: number;
    createdAt: string;
    updatedAt: string;
};

export const contractApi = createApi({
    reducerPath: "contractApi",
    baseQuery: fetchBaseQuery({
        baseUrl: "/api",
        credentials: "include",
    }),
    tagTypes: ["Contract"],
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
            query: (body) => ({
                url: "/contracts/drafts",
                method: "POST",
                body,
            }),
            invalidatesTags: ["Contract"],
        }),
        publishContract: builder.mutation<
            ContractSaveResponse,
            PublishContractRequest
        >({
            query: (body) => ({
                url: "/contracts/publish",
                method: "POST",
                body,
            }),
            invalidatesTags: ["Contract"],
        }),
    }),
});

export const {
    useGetContractsQuery,
    useGetContractQuery,
    useSaveDraftMutation,
    usePublishContractMutation,
} = contractApi;
