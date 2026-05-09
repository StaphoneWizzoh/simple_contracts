import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type {
    Signatory,
    AddSignatoryRequest,
    GenerateSigningLinkResponse,
    SigningContext,
    SubmitSignatureRequest,
} from "@/types/signing";

export type {
    Signatory,
    AddSignatoryRequest,
    GenerateSigningLinkResponse,
    SigningContext,
    SubmitSignatureRequest,
};

export const signingApi = createApi({
    reducerPath: "signingApi",
    baseQuery: fetchBaseQuery({ baseUrl: "/api", credentials: "include" }),
    tagTypes: ["Signatories"],
    endpoints: (builder) => ({
        getSignatories: builder.query<{ signatories: Signatory[] }, string>({
            query: (contractId) => `/contracts/${contractId}/signatories`,
            providesTags: (_r, _e, id) => [{ type: "Signatories", id }],
        }),
        addSignatory: builder.mutation<{ signatory: Signatory }, { contractId: string } & AddSignatoryRequest>({
            query: ({ contractId, ...body }) => ({
                url: `/contracts/${contractId}/signatories`,
                method: "POST",
                body,
            }),
            invalidatesTags: (_r, _e, arg) => [{ type: "Signatories", id: arg.contractId }],
        }),
        removeSignatory: builder.mutation<{ success: boolean }, { contractId: string; partyId: string }>({
            query: ({ contractId, partyId }) => ({
                url: `/contracts/${contractId}/signatories/${partyId}`,
                method: "DELETE",
            }),
            invalidatesTags: (_r, _e, arg) => [{ type: "Signatories", id: arg.contractId }],
        }),
        generateSigningLink: builder.mutation<GenerateSigningLinkResponse, { contractId: string; partyId: string }>({
            query: ({ contractId, partyId }) => ({
                url: `/contracts/${contractId}/signatories/${partyId}/invite`,
                method: "POST",
            }),
            invalidatesTags: (_r, _e, arg) => [{ type: "Signatories", id: arg.contractId }],
        }),

        // Public endpoints — no auth required
        getSigningContext: builder.query<SigningContext, string>({
            query: (token) => `/sign/${token}`,
        }),
        submitSignature: builder.mutation<{ success: boolean }, { token: string } & SubmitSignatureRequest>({
            query: ({ token, ...body }) => ({
                url: `/sign/${token}/submit`,
                method: "POST",
                body,
            }),
        }),
        declineSignature: builder.mutation<{ success: boolean }, { token: string; reason?: string }>({
            query: ({ token, reason }) => ({
                url: `/sign/${token}/decline`,
                method: "POST",
                body: { reason },
            }),
        }),
    }),
});

export const {
    useGetSignatoriesQuery,
    useAddSignatoryMutation,
    useRemoveSignatoryMutation,
    useGenerateSigningLinkMutation,
    useGetSigningContextQuery,
    useSubmitSignatureMutation,
    useDeclineSignatureMutation,
} = signingApi;
