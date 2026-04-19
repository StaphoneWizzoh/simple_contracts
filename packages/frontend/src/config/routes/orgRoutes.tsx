import type { RouteObject } from "react-router-dom";

import ProtectedRoute from "@/components/ProtectedRoute";
import { OrgOnboardingPage, OrgSettingsPage, MembersPage, RolesPage } from "./lazyComponents";

export const orgRoutes: RouteObject = {
    path: "/org",
    children: [
        {
            path: "onboarding",
            // Onboarding only requires auth — no org membership yet
            element: <OrgOnboardingPage />,
        },
        {
            index: true,
            element: <ProtectedRoute><OrgSettingsPage /></ProtectedRoute>,
        },
        {
            path: "settings",
            element: <ProtectedRoute><OrgSettingsPage /></ProtectedRoute>,
        },
        {
            path: "members",
            element: <ProtectedRoute><MembersPage /></ProtectedRoute>,
        },
        {
            path: "roles",
            element: <ProtectedRoute><RolesPage /></ProtectedRoute>,
        },
    ],
};
