import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

/**
 * Request body for saving or updating a contract draft.
 * When `contractId` is omitted a new contract is created; when provided the
 * existing contract's latest draft is overwritten.
 */
export type SaveDraftRequest = {
    /** Existing contract ID to update. Omit to create a new contract. */
    contractId?: string;
    /** Human-readable title shown in contract lists. */
    title: string;
    /** Optional summary or purpose of the contract. */
    description?: string;
    /** Name of the external party (customer, vendor, etc.). */
    counterpartyName?: string;
    /** Full contract body as an HTML string produced by the Tiptap editor. */
    contentHtml: string;
};

/**
 * Request body for publishing (moving to review) a contract.
 * Identical shape to {@link SaveDraftRequest} — the distinction is made by
 * the endpoint (`/contracts/publish` vs `/contracts/drafts`).
 */
export type PublishContractRequest = SaveDraftRequest;

/**
 * Response returned after saving a draft or publishing a contract.
 */
export type ContractSaveResponse = {
    /** ID of the parent contract record. */
    contractId: string;
    /** ID of the newly created `ContractVersion` row. */
    versionId: string;
    /** Monotonically increasing version number within the contract. */
    versionNumber: number;
    /** Contract lifecycle status after the operation (e.g. `"DRAFT"`, `"REVIEW"`). */
    status: string;
};

/**
 * Summary of a contract as returned by the list endpoint.
 * Used for rendering contract tables and dashboards.
 */
export type ContractListItem = {
    /** UUID of the contract. */
    id: string;
    /** Display title. */
    title: string;
    /** Lifecycle status string (e.g. `"DRAFT"`, `"ACTIVE"`). */
    status: string;
    /** Name of the counterparty, or `null` if not set. */
    counterpartyName: string | null;
    /** Latest version number. */
    versionNumber: number;
    /** ISO 8601 timestamp of the last update. */
    updatedAt: string;
    /** ISO 8601 timestamp when the contract was first created. */
    createdAt: string;
};

/**
 * Full contract detail as returned by the single-contract endpoint.
 * Includes the HTML content of the latest version.
 */
export type ContractDetail = {
    /** UUID of the contract. */
    id: string;
    /** Optional human-readable reference number (e.g. `"CTR-0042"`). */
    contractNumber: string | null;
    /** Display title. */
    title: string;
    /** Optional description / purpose. */
    description: string | null;
    /** Lifecycle status string. */
    status: string;
    /** Optional categorisation (e.g. `"NDA"`, `"Service Agreement"`). */
    contractType: string | null;
    /** Name of the external counterparty. */
    counterpartyName: string | null;
    /** ISO 8601 date when the contract becomes effective, or `null`. */
    effectiveAt: string | null;
    /** ISO 8601 date when the contract expires, or `null`. */
    expiresAt: string | null;
    /** Full HTML body of the latest version. */
    contentHtml: string;
    /** Latest version number. */
    versionNumber: number;
    /** ISO 8601 creation timestamp. */
    createdAt: string;
    /** ISO 8601 last-update timestamp. */
    updatedAt: string;
};

/**
 * RTK Query API slice for contract-related endpoints.
 *
 * All requests are sent to `/api` (proxied to the Nitro backend in dev).
 * Session cookies are included automatically via `credentials: "include"`.
 *
 * @example
 * ```tsx
 * const { data } = useGetContractsQuery();
 * const [saveDraft] = useSaveDraftMutation();
 * ```
 */
export const contractApi = createApi({
    reducerPath: "contractApi",
    baseQuery: fetchBaseQuery({
        baseUrl: "/api",
        credentials: "include",
    }),
    tagTypes: ["Contract"],
    endpoints: (builder) => ({
        /**
         * Fetch the list of all contracts belonging to the caller's organisation.
         * Requires an active session (org membership check on the backend).
         */
        getContracts: builder.query<{ contracts: ContractListItem[] }, void>({
            query: () => "/contracts",
            providesTags: ["Contract"],
        }),
        /**
         * Fetch the full detail of a single contract by its ID.
         *
         * @param id - UUID of the contract to retrieve.
         */
        getContract: builder.query<ContractDetail, string>({
            query: (id) => `/contracts/${id}`,
            providesTags: (_result, _error, id) => [{ type: "Contract", id }],
        }),
        /**
         * Create a new draft or overwrite an existing one.
         * Requires the `create_contracts` permission.
         * Invalidates the `Contract` tag so lists re-fetch automatically.
         */
        saveDraft: builder.mutation<ContractSaveResponse, SaveDraftRequest>({
            query: (body) => ({
                url: "/contracts/drafts",
                method: "POST",
                body,
            }),
            invalidatesTags: ["Contract"],
        }),
        /**
         * Publish a contract, moving it from `DRAFT` to `REVIEW` status.
         * Requires the `create_contracts` permission.
         * Invalidates the `Contract` tag so lists re-fetch automatically.
         */
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
