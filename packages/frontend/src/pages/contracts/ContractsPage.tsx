import { useNavigate } from "react-router-dom";
import { useGetCurrentUserQuery } from "@/store/services/authApi";
import { useGetContractsQuery } from "@/store/services/contractApi";

const STATUS_LABEL: Record<string, string> = {
    DRAFT: "Draft",
    REVIEW: "In Review",
    SENT_FOR_SIGNING: "Sent for Signing",
    ACTIVE: "Active",
    EXPIRED: "Expired",
    TERMINATED: "Terminated",
};

function statusColor(status: string) {
    switch (status) {
        case "DRAFT": return "text-yellow-400 bg-yellow-400/10 border-yellow-400/30";
        case "REVIEW": return "text-blue-400 bg-blue-400/10 border-blue-400/30";
        case "SENT_FOR_SIGNING": return "text-violet-400 bg-violet-400/10 border-violet-400/30";
        case "ACTIVE": return "text-emerald-400 bg-emerald-400/10 border-emerald-400/30";
        case "EXPIRED": return "text-gray-400 bg-gray-400/10 border-gray-400/30";
        case "TERMINATED": return "text-red-400 bg-red-400/10 border-red-400/30";
        default: return "text-gray-400 bg-gray-400/10 border-gray-400/30";
    }
}

export default function ContractsPage() {
    const navigate = useNavigate();
    const { data: currentUser, isLoading: isSessionLoading } = useGetCurrentUserQuery();
    const { data, isLoading: isContractsLoading, isError } = useGetContractsQuery(undefined, {
        skip: !currentUser?.id,
    });

    const isLoggedIn = Boolean(currentUser?.id);

    if (isSessionLoading) {
        return (
            <main className="min-h-screen bg-linear-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center">
                <p className="text-gray-400">Checking session...</p>
            </main>
        );
    }

    if (!isLoggedIn) {
        return (
            <main className="min-h-screen bg-linear-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-gray-300 mb-4">You must be logged in to view contracts.</p>
                    <button
                        onClick={() => navigate("/auth/login")}
                        className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
                    >
                        Go to Login
                    </button>
                </div>
            </main>
        );
    }

    const contracts = data?.contracts ?? [];

    return (
        <main className="min-h-screen bg-linear-to-br from-gray-950 via-gray-900 to-gray-950 px-4 py-10 md:px-10">
            <div className="mx-auto w-full max-w-5xl flex flex-col gap-6">
                <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                    <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-300/80">
                            My Contracts
                        </p>
                        <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
                            Contracts
                        </h1>
                        <p className="mt-1 text-gray-400 text-sm">
                            Logged in as{" "}
                            <span className="text-indigo-300">{currentUser?.email}</span>
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => navigate("/templates")}
                            className="rounded-lg border border-indigo-500/40 px-4 py-2 text-sm font-semibold text-indigo-300 hover:bg-indigo-600/20 transition"
                        >
                            From Template
                        </button>
                        <button
                            onClick={() => navigate("/contracts/new")}
                            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
                        >
                            + New Contract
                        </button>
                        <button
                            onClick={() => navigate("/")}
                            className="rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-sm font-medium text-gray-100 hover:bg-gray-700"
                        >
                            Home
                        </button>
                    </div>
                </header>

                {isContractsLoading && (
                    <p className="text-gray-400 text-sm">Loading contracts...</p>
                )}
                {isError && (
                    <p className="text-red-400 text-sm">Failed to load contracts.</p>
                )}

                {!isContractsLoading && contracts.length === 0 && (
                    <div className="rounded-2xl border border-dashed border-gray-700 p-12 text-center">
                        <p className="text-gray-400">No contracts yet.</p>
                        <div className="mt-4 flex items-center justify-center gap-3">
                            <button
                                onClick={() => navigate("/templates")}
                                className="rounded-lg border border-indigo-500/40 px-5 py-2 text-sm font-semibold text-indigo-300 hover:bg-indigo-600/20 transition"
                            >
                                Browse Templates
                            </button>
                            <button
                                onClick={() => navigate("/contracts/new")}
                                className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
                            >
                                Create from scratch
                            </button>
                        </div>
                    </div>
                )}

                {contracts.length > 0 && (
                    <div className="flex flex-col gap-3">
                        {contracts.map((c) => (
                            <button
                                key={c.id}
                                onClick={() => navigate(`/contracts/${c.id}`)}
                                className="text-left rounded-2xl border border-gray-700/60 bg-gray-900/60 p-5 hover:border-indigo-500/40 hover:bg-gray-900 transition group"
                            >
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                    <div className="flex flex-col gap-1">
                                        <h2 className="text-lg font-semibold text-white group-hover:text-indigo-200 transition">
                                            {c.title}
                                        </h2>
                                        {c.counterpartyName && (
                                            <p className="text-sm text-gray-400">
                                                Counterparty: {c.counterpartyName}
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-3 shrink-0">
                                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${statusColor(c.status)}`}>
                                            {STATUS_LABEL[c.status] ?? c.status}
                                        </span>
                                        <span className="text-xs text-gray-500">v{c.versionNumber}</span>
                                    </div>
                                </div>
                                <p className="mt-2 text-xs text-gray-500">
                                    Updated {new Date(c.updatedAt).toLocaleDateString()}
                                </p>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}
