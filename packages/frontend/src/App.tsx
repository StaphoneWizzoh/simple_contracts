import { Suspense } from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import { authRoutes } from "@/config/routes/authRoutes";
import { contractRoutes } from "@/config/routes/contractRoutes";
import { defaultRoutes } from "@/config/routes/defaultRoutes";

const router = createBrowserRouter([defaultRoutes, authRoutes, contractRoutes]);

const App = () => {
    return (
        <Suspense fallback={<p>Loading...</p>}>
            <RouterProvider router={router} />
        </Suspense>
    );
};

export default App;
