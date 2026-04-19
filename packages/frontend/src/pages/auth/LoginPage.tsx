import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { useLoginMutation } from "@/store/services/authApi";

function LoginPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const from = (location.state as { from?: string } | null)?.from ?? "/contracts";
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [login, { isLoading }] = useLoginMutation();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await login({ email, password }).unwrap();
            navigate(from, { replace: true });
        } catch (err: unknown) {
            const e = err as { data?: { message?: string; statusMessage?: string } };
            toast.error(e.data?.message ?? e.data?.statusMessage ?? "Invalid email or password.");
        }
    };

    return (
        <div className="relative flex items-center justify-center min-h-screen bg-linear-to-br from-gray-950 via-gray-900 to-gray-950 overflow-hidden">
            {/* Animated background elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float-slow"></div>
                <div
                    className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float-slow"
                    style={{ animationDelay: "2s" }}
                ></div>
                <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse-slow"></div>
            </div>

            {/* Form Container */}
            <div className="relative z-10 w-full max-w-md p-8 bg-gray-800/50 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-700/50">
                <h2 className="text-3xl font-bold text-center bg-linear-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent mb-8">
                    Welcome Back
                </h2>
                <form
                    onSubmit={handleSubmit}
                    className="flex flex-col space-y-4"
                >
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    />
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full px-4 py-3 mt-2 text-white font-semibold bg-linear-to-r from-indigo-600 to-purple-600 rounded-lg hover:from-indigo-500 hover:to-purple-500 focus:outline-none disabled:opacity-50 transition-all shadow-lg hover:shadow-indigo-500/50"
                    >
                        {isLoading ? "Logging in..." : "Login"}
                    </button>
                </form>
                <p className="mt-6 text-center text-gray-400">
                    Don't have an account?{" "}
                    <button
                        onClick={() => navigate("/auth/signup")}
                        className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors bg-none border-none cursor-pointer"
                    >
                        Sign up
                    </button>
                </p>
            </div>
        </div>
    );
}

export default LoginPage;
