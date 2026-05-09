import { Suspense } from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { Toaster } from "sonner";

import { authRoutes } from "@/config/routes/authRoutes";
import { contractRoutes } from "@/config/routes/contractRoutes";
import { defaultRoutes } from "@/config/routes/defaultRoutes";
import { orgRoutes } from "@/config/routes/orgRoutes";
import { inviteRoutes } from "@/config/routes/inviteRoutes";
import { signingRoutes } from "@/config/routes/signingRoutes";

const router = createBrowserRouter([defaultRoutes, authRoutes, contractRoutes, orgRoutes, inviteRoutes, signingRoutes]);

const App = () => {
    return (
        <>
            <Toaster
                theme="dark"
                position="top-right"
                toastOptions={{
                    style: {
                        background: "rgb(31 41 55 / 0.95)",
                        border: "1px solid rgb(75 85 99 / 0.5)",
                        color: "#f3f4f6",
                        backdropFilter: "blur(12px)",
                    },
                }}
            />
            <Suspense fallback={<p>Loading...</p>}>
                <RouterProvider router={router} />
            </Suspense>
        </>
    );
};

export default App;
