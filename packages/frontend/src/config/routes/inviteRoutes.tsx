import type { RouteObject } from "react-router-dom";
import { AcceptInvitePage } from "./lazyComponents";

export const inviteRoutes: RouteObject = {
    path: "/invites",
    children: [
        { path: ":token", element: <AcceptInvitePage /> },
    ],
};
