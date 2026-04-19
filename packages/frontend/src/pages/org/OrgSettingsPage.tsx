import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useGetOrgQuery, useUpdateOrgMutation } from "@/store/services/orgApi";

export default function OrgSettingsPage() {
    const navigate = useNavigate();
    const { data, isLoading } = useGetOrgQuery();
    const [updateOrg, { isLoading: isSaving }] = useUpdateOrgMutation();

    const [name, setName] = useState("");
    const [legalName, setLegalName] = useState("");

    const canManage = data?.permissions.includes("manage_org") ?? false;

    useEffect(() => {
        if (data?.org) {
            setName(data.org.name);
            setLegalName(data.org.legalName ?? "");
        }
    }, [data]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;
        try {
            await updateOrg({ name: name.trim(), legalName: legalName.trim() || undefined }).unwrap();
            toast.success("Organisation updated.");
        } catch {
            toast.error("Failed to update organisation.");
        }
    };

    if (isLoading) return <PageShell><p className="text-gray-400">Loading…</p></PageShell>;

    return (
        <PageShell>
            <header className="flex items-center justify-between mb-8">
                <div>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-400">Organisation</p>
                    <h1 className="text-2xl font-bold text-white mt-0.5">Settings</h1>
                </div>
                <nav className="flex gap-2">
                    <TabBtn onClick={() => navigate("/org/members")}>Members</TabBtn>
                    <TabBtn onClick={() => navigate("/org/roles")}>Roles</TabBtn>
                    <TabBtn onClick={() => navigate("/contracts")} variant="ghost">Contracts</TabBtn>
                </nav>
            </header>

            <div className="rounded-2xl border border-indigo-500/20 bg-gray-900/60 p-6 max-w-lg">
                <h2 className="text-sm font-bold text-gray-200 uppercase tracking-wider mb-5">General</h2>
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <label className="flex flex-col gap-2">
                        <span className="text-sm font-medium text-gray-300">Organisation name <span className="text-red-400">*</span></span>
                        <input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            disabled={!canManage}
                            className="rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-gray-100 outline-none ring-indigo-500 placeholder:text-gray-500 focus:ring-2 disabled:opacity-50"
                        />
                    </label>
                    <label className="flex flex-col gap-2">
                        <span className="text-sm font-medium text-gray-300">Legal name</span>
                        <input
                            value={legalName}
                            onChange={(e) => setLegalName(e.target.value)}
                            disabled={!canManage}
                            placeholder="Optional registered legal name"
                            className="rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-gray-100 outline-none ring-indigo-500 placeholder:text-gray-500 focus:ring-2 disabled:opacity-50"
                        />
                    </label>

                    {canManage && (
                        <button
                            type="submit"
                            disabled={isSaving || !name.trim()}
                            className="self-start rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSaving ? "Saving…" : "Save Changes"}
                        </button>
                    )}
                </form>
            </div>
        </PageShell>
    );
}

function PageShell({ children }: { children: React.ReactNode }) {
    return (
        <main className="min-h-screen bg-linear-to-br from-gray-950 via-gray-900 to-gray-950 px-4 py-10 md:px-10">
            <div className="mx-auto w-full max-w-4xl">{children}</div>
        </main>
    );
}

function TabBtn({ onClick, children, variant = "default" }: { onClick: () => void; children: React.ReactNode; variant?: "default" | "ghost" }) {
    const base = "rounded-lg px-4 py-2 text-sm font-medium transition";
    const styles = variant === "ghost"
        ? `${base} border border-gray-700 bg-gray-800 text-gray-400 hover:text-gray-100`
        : `${base} border border-indigo-500/30 bg-indigo-900/30 text-indigo-300 hover:bg-indigo-800/40`;
    return <button type="button" onClick={onClick} className={styles}>{children}</button>;
}
