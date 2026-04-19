import { RouteObject } from "react-router-dom";

import ProtectedRoute from "@/components/ProtectedRoute";
import { ContractEditorPage, ContractsPage } from "@/config/routes/lazyComponents";

export const contractRoutes: RouteObject = {
    path: "/contracts",
    children: [
        {
            index: true,
            element: (
                <ProtectedRoute>
                    <ContractsPage />
                </ProtectedRoute>
            ),
        },
        {
            path: "new",
            element: (
                <ProtectedRoute permission="create_contracts">
                    <ContractEditorPage />
                </ProtectedRoute>
            ),
        },
        {
            path: ":id",
            element: (
                <ProtectedRoute>
                    <ContractEditorPage />
                </ProtectedRoute>
            ),
        },
    ],
};
