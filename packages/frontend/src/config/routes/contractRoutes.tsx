import { RouteObject } from "react-router-dom";

import RouteWrapper from "@/components/RouteWrapper";
import {
    ContractEditorPage,
    ContractsPage,
} from "@/config/routes/lazyComponents";

export const contractRoutes: RouteObject = {
    path: "/contracts",
    children: [
        {
            index: true,
            element: (
                <RouteWrapper fallback={<p>Loading…</p>}>
                    <ContractsPage />
                </RouteWrapper>
            ),
        },
        {
            path: "new",
            element: (
                <RouteWrapper fallback={<p>Loading…</p>}>
                    <ContractEditorPage />
                </RouteWrapper>
            ),
        },
        {
            path: ":id",
            element: (
                <RouteWrapper fallback={<p>Loading…</p>}>
                    <ContractEditorPage />
                </RouteWrapper>
            ),
        },
    ],
};
