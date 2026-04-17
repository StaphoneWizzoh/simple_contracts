import { lazy } from "react";

//* Default routes
export const Landing = lazy(() => import("@/pages/Landing"));
export const ContractEditorPage = lazy(
    () => import("@/pages/contracts/ContractEditorPage"),
);

//* Auth pages
export const Login = lazy(() => import("@/pages/auth/LoginPage"));
export const Signup = lazy(() => import("@/pages/auth/SignupPage"));
