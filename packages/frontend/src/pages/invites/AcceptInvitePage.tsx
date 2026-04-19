import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useGetInviteDetailsQuery, useAcceptInviteMutation } from "@/store/services/orgApi";
import { useGetCurrentUserQuery } from "@/store/services/authApi";

export default function AcceptInvitePage() {
    const { token } = useParams<{ token: string }>();
    const navigate = useNavigate();

    const { data: user } = useGetCurrentUserQuery();
    const { data: invite, isLoading, isError, error } = useGetInviteDetailsQuery(token!, { skip: !token });
    const [acceptInvite, { isLoading: isAccepting }] = useAcceptInviteMutation();

    const errorMsg = (() => {
        if (!isError) return null;
        const e = error as { data?: { statusMessage?: string }; status?: number };
        return e.data?.statusMessage ?? "This invite link is invalid or has expired.";
    })();

    const handleAccept = async () => {
        if (!token) return;
        try {
            await acceptInvite(token).unwrap();
            toast.success(`Welcome to ${invite?.organisationName}!`);
            navigate("/contracts");
        } catch (err: unknown) {
            const e = err as { data?: { statusMessage?: string } };
            toast.error(e.data?.statusMessage ?? "Failed to accept invite. Please try again.");
        }
    };

    return (
        <main className="min-h-screen bg-linear-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center px-4">
            <div className="w-full max-w-md">
                <div className="rounded-2xl border border-indigo-500/20 bg-gray-900/80 p-8 shadow-xl">
                    {isLoading && (
                        <p className="text-gray-400 text-center">Checking invite…</p>
                    )}

                    {errorMsg && (
                        <div className="text-center">
                            <div className="text-4xl mb-4">🔒</div>
                            <h1 className="text-xl font-bold text-white mb-2">Invite Unavailable</h1>
                            <p className="text-sm text-gray-400 mb-6">{errorMsg}</p>
                            <button
                                onClick={() => navigate("/")}
                                className="rounded-lg bg-gray-800 border border-gray-700 px-5 py-2 text-sm text-gray-300 hover:text-white"
                            >
                                Go Home
                            </button>
                        </div>
                    )}

                    {invite && !errorMsg && (
                        <>
                            <div className="mb-6 text-center">
                                <div className="text-4xl mb-3">✉️</div>
                                <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-400 mb-1">You're invited</p>
                                <h1 className="text-2xl font-bold text-white">Join {invite.organisationName}</h1>
                                <p className="mt-2 text-sm text-gray-400">
                                    You've been invited to join as <span className="text-indigo-300 font-medium">{invite.roleName}</span>.
                                </p>
                                <p className="mt-1 text-xs text-gray-500">
                                    Invite sent to <span className="text-gray-300">{invite.email}</span> · Expires {new Date(invite.expiresAt).toLocaleDateString()}
                                </p>
                            </div>

                            {!user?.id ? (
                                <div className="flex flex-col gap-3">
                                    <p className="text-sm text-center text-amber-400 bg-amber-400/10 rounded-lg px-3 py-2">
                                        You need to be logged in to accept this invite.
                                    </p>
                                    <button
                                        onClick={() => navigate(`/auth/login?redirect=/invites/${token}`)}
                                        className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500"
                                    >
                                        Log in to Accept
                                    </button>
                                    <button
                                        onClick={() => navigate(`/auth/signup?redirect=/invites/${token}`)}
                                        className="rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-sm font-medium text-gray-300 hover:text-white"
                                    >
                                        Create an Account
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={handleAccept}
                                    disabled={isAccepting}
                                    className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isAccepting ? "Joining…" : `Accept & Join ${invite.organisationName}`}
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>
        </main>
    );
}
