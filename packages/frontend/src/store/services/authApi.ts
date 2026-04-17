import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export interface AuthResponse {
    id: string;
    email: string;
    name?: string;
    image?: string;
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface SignupRequest {
    email: string;
    password: string;
    name?: string;
}

type SessionResponse =
    | AuthResponse
    | {
          user: AuthResponse;
      };

export const authApi = createApi({
    reducerPath: "authApi",
    baseQuery: fetchBaseQuery({
        baseUrl: "/auth",
        credentials: "include",
    }),
    endpoints: (builder) => ({
        login: builder.mutation<AuthResponse, LoginRequest>({
            query: (credentials) => ({
                url: "/sign-in/email",
                method: "POST",
                body: credentials,
            }),
        }),
        signup: builder.mutation<AuthResponse, SignupRequest>({
            query: (credentials) => ({
                url: "/sign-up/email",
                method: "POST",
                body: credentials,
            }),
        }),
        logout: builder.mutation<void, void>({
            query: () => ({
                url: "/sign-out",
                method: "POST",
            }),
        }),
        getCurrentUser: builder.query<AuthResponse, void>({
            query: () => "/get-session",
            transformResponse: (response: SessionResponse) => {
                if ("user" in response) {
                    return response.user;
                }

                return response;
            },
        }),
    }),
});

export const {
    useLoginMutation,
    useSignupMutation,
    useLogoutMutation,
    useGetCurrentUserQuery,
} = authApi;
