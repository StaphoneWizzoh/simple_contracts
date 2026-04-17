import { RouteObject } from "react-router-dom";

import RouteWrapper from "@/components/RouteWrapper";
import { ContractEditorPage } from "@/config/routes/lazyComponents";

export const contractRoutes: RouteObject = {
    path: "/contracts/new",
    element: (
        <RouteWrapper fallback={<p>Loading...</p>}>
            <ContractEditorPage />
        </RouteWrapper>
    ),
};
