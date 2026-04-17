import { configureStore } from "@reduxjs/toolkit";

import { authApi } from "@/store/services/authApi";
import { contractApi } from "@/store/services/contractApi";

export const store = configureStore({
    reducer: {
        [authApi.reducerPath]: authApi.reducer,
        [contractApi.reducerPath]: contractApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(
            authApi.middleware,
            contractApi.middleware,
        ),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
