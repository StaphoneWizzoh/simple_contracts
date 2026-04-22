import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

/**
 * Authenticated user returned by Better Auth session endpoints.
 */
export interface AuthResponse {
    /** UUID of the user record. */
    id: string;
    /** Primary email address. */
    email: string;
    /** Display name, if set. */
    name?: string;
    /** URL to the user's avatar image, if set. */
    image?: string;
}

/**
 * Credentials required to sign in with email and password.
 */
export interface LoginRequest {
    /** Registered email address. */
    email: string;
    /** Account password. */
    password: string;
}

/**
 * Fields required to create a new account.
 */
export interface SignupRequest {
    /** Email address for the new account. */
    email: string;
    /** Password for the new account. */
    password: string;
    /** Optional display name shown in the UI. */
    name?: string;
}

/**
 * RTK Query API slice for Better Auth session endpoints.
 *
 * Targets `/auth` (proxied to the Nitro backend in dev).
 * Session cookies are included automatically via `credentials: "include"`.
 *
 * @example
 * ```tsx
 * const [login] = useLoginMutation();
 * const { data: user } = useGetCurrentUserQuery();
 * ```
 */
export const authApi = createApi({
    reducerPath: "authApi",
    baseQuery: fetchBaseQuery({
        baseUrl: "/auth",
        credentials: "include",
    }),
    tagTypes: ["Session"],
    endpoints: (builder) => ({
        /**
         * Sign in with email and password.
         * On success the backend sets an HTTP-only session cookie.
         * Invalidates the `Session` tag so `useGetCurrentUserQuery` re-fetches.
         */
        login: builder.mutation<AuthResponse, LoginRequest>({
            query: (credentials) => ({
                url: "/sign-in/email",
                method: "POST",
                body: credentials,
            }),
            invalidatesTags: ["Session"],
        }),
        /**
         * Register a new user account.
         * On success the backend creates the user and sets a session cookie.
         * Invalidates the `Session` tag so `useGetCurrentUserQuery` re-fetches.
         */
        signup: builder.mutation<AuthResponse, SignupRequest>({
            query: (credentials) => ({
                url: "/sign-up/email",
                method: "POST",
                body: credentials,
            }),
            invalidatesTags: ["Session"],
        }),
        /**
         * Sign out the current user and clear the session cookie.
         * Invalidates the `Session` tag to reset all session-dependent queries.
         */
        logout: builder.mutation<void, void>({
            query: () => ({
                url: "/sign-out",
                method: "POST",
            }),
            invalidatesTags: ["Session"],
        }),
        /**
         * Return the currently authenticated user, or `null` if no session exists.
         *
         * The response is normalised from the Better Auth session envelope
         * (`{ user: {...} }`) to a plain {@link AuthResponse} object.
         */
        getCurrentUser: builder.query<AuthResponse | null, void>({
            query: () => "/get-session",
            transformResponse: (response: unknown): AuthResponse | null => {
                if (!response || typeof response !== "object") return null;
                const r = response as Record<string, unknown>;
                if (r.user && typeof r.user === "object") {
                    return r.user as AuthResponse;
                }
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
