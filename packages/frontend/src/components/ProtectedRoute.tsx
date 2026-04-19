import { Navigate, useLocation } from "react-router-dom";
import { useGetCurrentUserQuery } from "@/store/services/authApi";
import { useGetOrgQuery } from "@/store/services/orgApi";

interface ProtectedRouteProps {
    children: React.ReactNode;
    permission?: string;
}

export default function ProtectedRoute({ children, permission }: ProtectedRouteProps) {
    const location = useLocation();
    const { data: user, isLoading: authLoading } = useGetCurrentUserQuery();

    const skipOrg = authLoading || !user?.id;
    const { data: orgData, isLoading: orgLoading, isError: orgError, error: orgErr } = useGetOrgQuery(undefined, {
        skip: skipOrg,
    });

    if (authLoading || (!skipOrg && orgLoading)) {
        return (
            <main className="min-h-screen bg-linear-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-6 h-6 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin" />
                    <p className="text-sm text-gray-400">Loading…</p>
                </div>
            </main>
        );
    }

    if (!user?.id) {
        return <Navigate to="/auth/login" state={{ from: location.pathname }} replace />;
    }

    // 403 = no org membership → send to onboarding
    if (orgError) {
        const status = (orgErr as { status?: number })?.status;
        if (status === 403) return <Navigate to="/org/onboarding" replace />;
        if (status === 401) return <Navigate to="/auth/login" state={{ from: location.pathname }} replace />;
    }

    if (permission && orgData && !orgData.permissions.includes(permission)) {
        return (
            <main className="min-h-screen bg-linear-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center px-4">
                <div className="text-center max-w-sm">
                    <p className="text-4xl mb-4">🔒</p>
                    <h1 className="text-xl font-bold text-white mb-2">Access Denied</h1>
                    <p className="text-sm text-gray-400 mb-6">
                        You don't have permission to access this page. Contact your organisation admin.
                    </p>
                    <a href="/contracts" className="text-sm text-indigo-400 hover:text-indigo-300 underline">
                        Back to Contracts
                    </a>
                </div>
            </main>
        );
    }

    return <>{children}</>;
}
