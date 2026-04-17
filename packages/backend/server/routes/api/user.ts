import { auth } from "../../auth";

export default defineEventHandler(async (event) => {
    const session = await auth.api.getSession({
        headers: event.node.req.headers,
    });

    if (!session) {
        return createError({
            statusCode: 401,
            statusMessage: "Unauthorized",
        });
    }

    return {
        message: "Hello from API!",
        user: session.user,
        session: session.session,
    };
});
