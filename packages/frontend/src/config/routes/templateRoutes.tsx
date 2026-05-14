import { RouteObject } from "react-router-dom";
import { lazy } from "react";

import ProtectedRoute from "@/components/ProtectedRoute";

const TemplatesPage = lazy(() => import("@/pages/templates/TemplatesPage"));
const TemplateEditorPage = lazy(() => import("@/pages/templates/TemplateEditorPage"));

export const templateRoutes: RouteObject = {
    path: "/templates",
    children: [
        {
            index: true,
            element: (
                <ProtectedRoute>
                    <TemplatesPage />
                </ProtectedRoute>
            ),
        },
        {
            path: "new",
            element: (
                <ProtectedRoute permission="create_templates">
                    <TemplateEditorPage />
                </ProtectedRoute>
            ),
        },
        {
            path: ":id",
            element: (
                <ProtectedRoute permission="create_templates">
                    <TemplateEditorPage />
                </ProtectedRoute>
            ),
        },
    ],
};
