import { Navigate, Outlet, RouteObject } from "react-router";

import { Login, Signup } from "@/config/routes/lazyComponents";
import RouteWrapper from "@/components/RouteWrapper";

export const authRoutes: RouteObject = {
    path: "/auth",
    element: (
        <RouteWrapper fallback={<p>Loading</p>}>
            <Outlet />
        </RouteWrapper>
    ),
    children: [
        {
            index: true,
            element: <Navigate to="login" replace />,
        },
        {
            path: "login",
            element: (
                <RouteWrapper fallback={<p>Loading</p>}>
                    <Login />
                </RouteWrapper>
            ),
        },
        {
            path: "signup",
            element: (
                <RouteWrapper fallback={<p>Loading</p>}>
                    <Signup />
                </RouteWrapper>
            ),
        },
    ],
};
