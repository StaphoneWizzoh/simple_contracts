import { defineNitroConfig } from "nitropack";

export default defineNitroConfig({
    srcDir: "server",
    devServer: {
        watch: ["server"],
        port: 3000,
    },
    compatibilityDate: "2026-04-18",
    routeRules: {
        "/**": {
            cors: true,
            headers: {
                "Access-Control-Allow-Origin": "http://localhost:5173",
                "Access-Control-Allow-Credentials": "true",
                "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type,Authorization",
            },
        },
    },
});
