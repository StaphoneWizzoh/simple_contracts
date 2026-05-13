import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { ContractTemplate, CreateTemplateRequest, UpdateTemplateRequest } from "@/types/templates";

interface TemplatesResponse {
    templates: Omit<ContractTemplate, "contentHtml" | "contentJson" | "contentText" | "variables">[];
}

interface TemplateDetailResponse {
    template: ContractTemplate;
}

interface CreateFromTemplateResponse {
    contract: {
        id: string;
        contractNumber: string;
        title: string;
        status: string;
    };
}

export const templateApi = createApi({
    reducerPath: "templateApi",
    baseQuery: fetchBaseQuery({ baseUrl: "/api" }),
    tagTypes: ["Templates"],
    endpoints: (builder) => ({
        listTemplates: builder.query<TemplatesResponse, void>({
            query: () => "/templates",
            providesTags: ["Templates"],
        }),

        getTemplate: builder.query<TemplateDetailResponse, string>({
            query: (id) => `/templates/${id}`,
            providesTags: (_, __, id) => [{ type: "Templates", id }],
        }),

        createTemplate: builder.mutation<TemplateDetailResponse, CreateTemplateRequest>({
            query: (body) => ({
                url: "/templates",
                method: "POST",
                body,
            }),
            invalidatesTags: ["Templates"],
        }),

        updateTemplate: builder.mutation<
            TemplateDetailResponse,
            { id: string; body: UpdateTemplateRequest }
        >({
            query: ({ id, body }) => ({
                url: `/templates/${id}`,
                method: "PUT",
                body,
            }),
            invalidatesTags: (_, __, { id }) => [{ type: "Templates", id }, "Templates"],
        }),

        deleteTemplate: builder.mutation<{ success: boolean }, string>({
            query: (id) => ({
                url: `/templates/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: ["Templates"],
        }),

        createContractFromTemplate: builder.mutation<
            CreateFromTemplateResponse,
            { templateId: string; title?: string }
        >({
            query: ({ templateId, title }) => ({
                url: `/contracts/from-template/${templateId}`,
                method: "POST",
                body: { title },
            }),
        }),
    }),
});

export const {
    useListTemplatesQuery,
    useGetTemplateQuery,
    useCreateTemplateMutation,
    useUpdateTemplateMutation,
    useDeleteTemplateMutation,
    useCreateContractFromTemplateMutation,
} = templateApi;
