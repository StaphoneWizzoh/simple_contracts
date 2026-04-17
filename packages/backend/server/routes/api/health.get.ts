export default defineEventHandler(() => {
    return {
        ok: true,
        service: "backend",
        timestamp: new Date().toISOString(),
    };
});
