import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useGetCurrentUserQuery, useLogoutMutation } from "@/store/services/authApi";
import { useGetOrgQuery } from "@/store/services/orgApi";
import { useGetContractsQuery } from "@/store/services/contractApi";

export default function LandingPage() {
    const navigate = useNavigate();
    const { data: user, isLoading: isSessionLoading } = useGetCurrentUserQuery();
    const isLoggedIn = Boolean(user?.id);

    if (isSessionLoading) {
        return (
            <div className="min-h-screen bg-linear-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center">
                <div className="w-6 h-6 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
            </div>
        );
    }

    return isLoggedIn ? <Dashboard user={user!} /> : <MarketingPage />;
}

/* ── Logged-in dashboard home ─────────────────────────────────────────── */

function Dashboard({ user }: { user: { id: string; name?: string | null; email: string } }) {
    const navigate = useNavigate();
    const { data: orgData, isLoading: isOrgLoading } = useGetOrgQuery();
    const { data: contractsData } = useGetContractsQuery();
    const [logout] = useLogoutMutation();

    const org = orgData?.org;
    const permissions = orgData?.permissions ?? [];
    const contracts = contractsData?.contracts ?? [];
    const recentContracts = contracts.slice(0, 5);

    const canCreateContracts = permissions.includes("create_contracts");
    const canManageOrg = permissions.includes("manage_org");
    const canManageUsers = permissions.includes("manage_users");
    const canManageRoles = permissions.includes("manage_roles");

    const handleLogout = async () => {
        await logout();
        navigate("/");
    };

    const statusColor = (status: string) => {
        switch (status) {
            case "DRAFT": return "text-yellow-400 bg-yellow-400/10 border-yellow-400/30";
            case "REVIEW": return "text-blue-400 bg-blue-400/10 border-blue-400/30";
            case "EXECUTED": return "text-emerald-400 bg-emerald-400/10 border-emerald-400/30";
            default: return "text-gray-400 bg-gray-400/10 border-gray-400/30";
        }
    };

    return (
        <div className="min-h-screen bg-linear-to-br from-gray-950 via-gray-900 to-gray-950 flex flex-col font-sans">
            {/* Navbar */}
            <header className="w-full px-6 py-4 flex justify-between items-center bg-gray-900/50 backdrop-blur-md fixed top-0 z-50 border-b border-gray-800">
                <button
                    onClick={() => navigate("/")}
                    className="text-xl font-extrabold bg-linear-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent tracking-tight"
                >
                    SimpleContracts
                </button>
                <div className="flex items-center gap-3">
                    <span className="hidden sm:block text-sm text-gray-400">
                        {user.name ?? user.email}
                    </span>
                    <button
                        onClick={() => navigate("/contracts")}
                        className="px-4 py-1.5 text-sm font-medium text-gray-300 hover:text-indigo-300 transition-colors"
                    >
                        Contracts
                    </button>
                    <button
                        onClick={() => navigate("/org/settings")}
                        className="px-4 py-1.5 text-sm font-medium text-gray-300 hover:text-indigo-300 transition-colors"
                    >
                        Organisation
                    </button>
                    <button
                        onClick={handleLogout}
                        className="px-4 py-1.5 text-sm font-medium text-gray-500 hover:text-red-400 transition-colors"
                    >
                        Logout
                    </button>
                </div>
            </header>

            <main className="flex-1 pt-20 px-4 py-10 md:px-10">
                <div className="mx-auto w-full max-w-5xl flex flex-col gap-8">

                    {/* Welcome banner */}
                    <div className="rounded-2xl border border-indigo-500/20 bg-gray-900/60 p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-400">Welcome back</p>
                            <h1 className="text-2xl font-bold text-white mt-0.5">
                                {user.name ?? user.email}
                            </h1>
                            {isOrgLoading ? (
                                <p className="text-sm text-gray-500 mt-1">Loading organisation…</p>
                            ) : org ? (
                                <p className="text-sm text-gray-400 mt-1">
                                    {org.name}
                                    {org.legalName && <span className="text-gray-600"> · {org.legalName}</span>}
                                </p>
                            ) : (
                                <button
                                    onClick={() => navigate("/org/onboarding")}
                                    className="mt-2 text-sm text-amber-400 hover:text-amber-300 underline"
                                >
                                    Set up your organisation →
                                </button>
                            )}
                        </div>
                        {canCreateContracts && (
                            <button
                                onClick={() => navigate("/contracts/new")}
                                className="shrink-0 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 transition"
                            >
                                + New Contract
                            </button>
                        )}
                    </div>

                    {/* Quick stats */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {[
                            { label: "Total Contracts", value: contracts.length, onClick: () => navigate("/contracts") },
                            { label: "Drafts", value: contracts.filter(c => c.status === "DRAFT").length, onClick: () => navigate("/contracts") },
                            { label: "In Review", value: contracts.filter(c => c.status === "REVIEW").length, onClick: () => navigate("/contracts") },
                            { label: "Executed", value: contracts.filter(c => c.status === "EXECUTED").length, onClick: () => navigate("/contracts") },
                        ].map((stat) => (
                            <button
                                key={stat.label}
                                onClick={stat.onClick}
                                className="rounded-xl border border-gray-700/60 bg-gray-900/60 p-4 text-left hover:border-indigo-500/40 transition group"
                            >
                                <p className="text-2xl font-bold text-white group-hover:text-indigo-300 transition">{stat.value}</p>
                                <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
                            </button>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Recent contracts */}
                        <div className="lg:col-span-2 flex flex-col gap-3">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500">Recent Contracts</h2>
                                <button
                                    onClick={() => navigate("/contracts")}
                                    className="text-xs text-indigo-400 hover:text-indigo-300"
                                >
                                    View all →
                                </button>
                            </div>

                            {recentContracts.length === 0 ? (
                                <div className="rounded-xl border border-dashed border-gray-700 p-8 text-center">
                                    <p className="text-sm text-gray-500">No contracts yet.</p>
                                    {canCreateContracts && (
                                        <button
                                            onClick={() => navigate("/contracts/new")}
                                            className="mt-3 text-sm text-indigo-400 hover:text-indigo-300 underline"
                                        >
                                            Create your first contract
                                        </button>
                                    )}
                                </div>
                            ) : (
                                recentContracts.map((c) => (
                                    <button
                                        key={c.id}
                                        onClick={() => navigate(`/contracts/${c.id}`)}
                                        className="text-left rounded-xl border border-gray-700/60 bg-gray-900/60 px-5 py-3.5 hover:border-indigo-500/40 hover:bg-gray-900 transition group"
                                    >
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className="text-sm font-semibold text-white group-hover:text-indigo-200 transition truncate">{c.title}</p>
                                                {c.counterpartyName && (
                                                    <p className="text-xs text-gray-500 truncate">{c.counterpartyName}</p>
                                                )}
                                            </div>
                                            <span className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full border ${statusColor(c.status)}`}>
                                                {c.status}
                                            </span>
                                        </div>
                                        <p className="mt-1.5 text-xs text-gray-600">
                                            Updated {new Date(c.updatedAt).toLocaleDateString()}
                                        </p>
                                    </button>
                                ))
                            )}
                        </div>

                        {/* Quick actions */}
                        <div className="flex flex-col gap-3">
                            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500">Quick Actions</h2>
                            <div className="flex flex-col gap-2">
                                {canCreateContracts && (
                                    <ActionCard
                                        label="New Contract"
                                        desc="Start drafting a new contract"
                                        onClick={() => navigate("/contracts/new")}
                                        accent="indigo"
                                    />
                                )}
                                <ActionCard
                                    label="All Contracts"
                                    desc="View and manage your contracts"
                                    onClick={() => navigate("/contracts")}
                                    accent="gray"
                                />
                                {(canManageOrg || canManageUsers || canManageRoles) && (
                                    <ActionCard
                                        label="Organisation Settings"
                                        desc="Manage your org, members & roles"
                                        onClick={() => navigate("/org/settings")}
                                        accent="gray"
                                    />
                                )}
                                {canManageUsers && (
                                    <ActionCard
                                        label="Invite a Member"
                                        desc="Add team members to your org"
                                        onClick={() => navigate("/org/members")}
                                        accent="gray"
                                    />
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

function ActionCard({ label, desc, onClick, accent }: {
    label: string;
    desc: string;
    onClick: () => void;
    accent: "indigo" | "gray";
}) {
    const border = accent === "indigo"
        ? "border-indigo-500/30 hover:border-indigo-400/60 hover:bg-indigo-900/20"
        : "border-gray-700/60 hover:border-gray-600";
    return (
        <button
            onClick={onClick}
            className={`text-left rounded-xl border bg-gray-900/60 px-4 py-3.5 transition group ${border}`}
        >
            <p className="text-sm font-semibold text-white group-hover:text-indigo-200 transition">{label}</p>
            <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
        </button>
    );
}

/* ── Marketing page for logged-out visitors ───────────────────────────── */

function MarketingPage() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-linear-to-br from-gray-950 via-gray-900 to-gray-950 flex flex-col font-sans">
            {/* Navbar */}
            <header className="w-full px-6 py-4 flex justify-between items-center bg-gray-900/50 backdrop-blur-md fixed top-0 z-50 border-b border-gray-800">
                <div className="text-2xl font-extrabold bg-linear-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent tracking-tight">
                    SimpleContracts
                </div>
                <div className="space-x-4">
                    <button
                        onClick={() => navigate("/auth/login")}
                        className="px-5 py-2 text-sm font-medium text-gray-300 hover:text-indigo-400 transition-colors"
                    >
                        Login
                    </button>
                    <button
                        onClick={() => navigate("/auth/signup")}
                        className="px-5 py-2 text-sm font-medium text-white bg-indigo-600 rounded-full hover:bg-indigo-500 transition-all shadow-md hover:shadow-lg hover:shadow-indigo-500/50 transform hover:-translate-y-0.5"
                    >
                        Register
                    </button>
                </div>
            </header>

            {/* Hero */}
            <main className="flex-1 flex flex-col items-center justify-center text-center px-4 mt-20">
                <div className="max-w-3xl space-y-8 animate-fade-in-up">
                    <h1 className="text-5xl md:text-6xl font-extrabold text-white leading-tight tracking-tight">
                        Smart, Secure & Simple{" "}
                        <br className="hidden md:block" />
                        <span className="text-transparent bg-clip-text bg-linear-to-r from-indigo-400 to-purple-400">
                            Contract Management
                        </span>
                    </h1>

                    <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
                        Create, sign, and manage your contracts effortlessly.
                        Our platform streamlines your legal workflow so you can
                        focus on building your business instead of paperwork.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
                        <button
                            onClick={() => navigate("/auth/signup")}
                            className="w-full sm:w-auto px-8 py-4 text-lg font-semibold text-white bg-indigo-600 rounded-full hover:bg-indigo-500 transition-all shadow-lg hover:shadow-indigo-500/50 transform hover:-translate-y-1"
                        >
                            Get Started for Free
                        </button>
                        <button
                            onClick={() => navigate("/auth/login")}
                            className="w-full sm:w-auto px-8 py-4 text-lg font-semibold text-indigo-400 bg-gray-800 border border-indigo-500/30 rounded-full hover:bg-gray-700 hover:border-indigo-400 transition-all shadow-sm hover:shadow-md transform hover:-translate-y-1"
                        >
                            Log In
                        </button>
                    </div>
                </div>

                {/* Feature highlights */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-24 max-w-5xl mx-auto px-6 pb-20">
                    {[
                        { title: "Draft Instantly", desc: "Use smart templates to draft legally binding contracts in seconds." },
                        { title: "Sign Securely", desc: "Collect e-signatures and maintain an immutable audit trail for every document." },
                        { title: "Manage Easily", desc: "Keep all your agreements organized and secure in one unified dashboard." },
                    ].map((feature, i) => (
                        <div
                            key={i}
                            className="p-6 bg-gray-800/50 rounded-2xl shadow-sm border border-gray-700 hover:shadow-xl hover:shadow-indigo-500/20 transition-all duration-300 transform hover:-translate-y-2 group"
                        >
                            <div className="w-12 h-12 mb-4 rounded-full bg-indigo-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <div className="w-6 h-6 bg-indigo-400 rounded-full opacity-75"></div>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                            <p className="text-gray-400">{feature.desc}</p>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
}
