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

export const contractApi = createApi({
    reducerPath: "contractApi",
    baseQuery: fetchBaseQuery({
        baseUrl: "/api",
        credentials: "include",
    }),
    endpoints: (builder) => ({
        saveDraft: builder.mutation<ContractSaveResponse, SaveDraftRequest>({
            query: (body) => ({
                url: "/contracts/drafts",
                method: "POST",
                body,
            }),
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
        }),
    }),
});

export const { useSaveDraftMutation, usePublishContractMutation } = contractApi;
