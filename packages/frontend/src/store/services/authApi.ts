import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { AuthResponse, LoginRequest, SignupRequest } from "@/types/auth";

export type { AuthResponse, LoginRequest, SignupRequest };

export const authApi = createApi({
    reducerPath: "authApi",
    baseQuery: fetchBaseQuery({
        baseUrl: "/auth",
        credentials: "include",
    }),
    tagTypes: ["Session"],
    endpoints: (builder) => ({
        login: builder.mutation<AuthResponse, LoginRequest>({
            query: (credentials) => ({
                url: "/sign-in/email",
                method: "POST",
                body: credentials,
            }),
            invalidatesTags: ["Session"],
        }),
        signup: builder.mutation<AuthResponse, SignupRequest>({
            query: (credentials) => ({
                url: "/sign-up/email",
                method: "POST",
                body: credentials,
            }),
            invalidatesTags: ["Session"],
        }),
        logout: builder.mutation<void, void>({
            query: () => ({
                url: "/sign-out",
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: {},
            }),
            invalidatesTags: ["Session"],
        }),
        getCurrentUser: builder.query<AuthResponse | null, void>({
            query: () => "/get-session",
            transformResponse: (response: unknown): AuthResponse | null => {
                if (!response || typeof response !== "object") return null;
                const r = response as Record<string, unknown>;
                if (r.user && typeof r.user === "object") return r.user as AuthResponse;
                if (typeof r.id === "string") return r as unknown as AuthResponse;
                return null;
            },
            providesTags: ["Session"],
        }),

    }),
});

export const {
    useLoginMutation,
    useSignupMutation,
    useLogoutMutation,
    useGetCurrentUserQuery,
} = authApi;
