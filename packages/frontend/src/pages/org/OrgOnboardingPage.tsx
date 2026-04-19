import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useGetCurrentUserQuery } from "@/store/services/authApi";
import { useCreateOrgMutation } from "@/store/services/orgApi";

export default function OrgOnboardingPage() {
    const navigate = useNavigate();
    const { data: user, isLoading } = useGetCurrentUserQuery();
    const [name, setName] = useState("");
    const [legalName, setLegalName] = useState("");

    const [createOrg, { isLoading: isSaving }] = useCreateOrgMutation();

    if (isLoading) return null;
    if (!user?.id) return <Navigate to="/auth/login" replace />;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;
        try {
            await createOrg({ name: name.trim(), legalName: legalName.trim() || undefined }).unwrap();
            toast.success("Organisation created successfully");
            navigate("/contracts");
        } catch {
            toast.error("Failed to save organisation details. Please try again.");
        }
    };

    return (
        <main className="min-h-screen bg-linear-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center px-4">
            <div className="w-full max-w-md">
                <div className="rounded-2xl border border-indigo-500/20 bg-gray-900/80 p-8 shadow-xl">
                    <div className="mb-8">
                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-400 mb-1">Welcome</p>
                        <h1 className="text-2xl font-bold text-white">Set up your organisation</h1>
                        <p className="mt-2 text-sm text-gray-400">
                            Give your organisation a name so your team can find it.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                        <label className="flex flex-col gap-2">
                            <span className="text-sm font-medium text-gray-200">Organisation name <span className="text-red-400">*</span></span>
                            <input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Acme Inc"
                                required
                                className="rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-gray-100 outline-none ring-indigo-500 placeholder:text-gray-500 focus:ring-2"
                            />
                        </label>

                        <label className="flex flex-col gap-2">
                            <span className="text-sm font-medium text-gray-200">Legal name <span className="text-gray-500">(optional)</span></span>
                            <input
                                value={legalName}
                                onChange={(e) => setLegalName(e.target.value)}
                                placeholder="Acme Incorporated Ltd"
                                className="rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-gray-100 outline-none ring-indigo-500 placeholder:text-gray-500 focus:ring-2"
                            />
                        </label>

                        <button
                            type="submit"
                            disabled={isSaving || !name.trim()}
                            className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {isSaving ? "Saving…" : "Continue"}
                        </button>
                    </form>
                </div>
            </div>
        </main>
    );
}
