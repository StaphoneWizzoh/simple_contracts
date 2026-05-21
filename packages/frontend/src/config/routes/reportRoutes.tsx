import { RouteObject } from "react-router-dom";
import ProtectedRoute from "@/components/ProtectedRoute";
import { ReportsPage } from "@/config/routes/lazyComponents";

export const reportRoutes: RouteObject = {
    path: "/reports",
    element: (
        <ProtectedRoute permission="view_reports">
            <ReportsPage />
        </ProtectedRoute>
    ),
};
