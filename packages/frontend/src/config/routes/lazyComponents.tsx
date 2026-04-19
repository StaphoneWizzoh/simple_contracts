import { lazy } from "react";

//* Default routes
export const Landing = lazy(() => import("@/pages/Landing"));

//* Auth pages
export const Login = lazy(() => import("@/pages/auth/LoginPage"));
export const Signup = lazy(() => import("@/pages/auth/SignupPage"));

//* Contract pages
export const ContractsPage = lazy(() => import("@/pages/contracts/ContractsPage"));
export const ContractEditorPage = lazy(() => import("@/pages/contracts/ContractEditorPage"));

//* Org pages
export const OrgOnboardingPage = lazy(() => import("@/pages/org/OrgOnboardingPage"));
export const OrgSettingsPage = lazy(() => import("@/pages/org/OrgSettingsPage"));
export const MembersPage = lazy(() => import("@/pages/org/MembersPage"));
export const RolesPage = lazy(() => import("@/pages/org/RolesPage"));

//* Invite pages
export const AcceptInvitePage = lazy(() => import("@/pages/invites/AcceptInvitePage"));
