import type { RouteObject } from "react-router-dom";
import { SigningPage } from "./lazyComponents";

export const signingRoutes: RouteObject = {
    path: "/sign",
    children: [
        { path: ":token", element: <SigningPage /> },
    ],
};
