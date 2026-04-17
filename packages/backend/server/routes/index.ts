export default defineEventHandler((event) => {
    return {
        message: "Hello from Nitro Backend!",
        timestamp: new Date().toISOString(),
    };
});
