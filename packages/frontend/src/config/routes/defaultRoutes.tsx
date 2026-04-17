import { RouteObject } from "react-router-dom";
import { Landing } from "@/config/routes/lazyComponents";
import RouteWrapper from "@/components/RouteWrapper";

export const defaultRoutes: RouteObject = {
    path: "/",
    element: (
        <RouteWrapper>
            <Landing />
        </RouteWrapper>
    ),
};
