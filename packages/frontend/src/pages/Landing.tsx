import { useNavigate } from "react-router-dom";

export default function LandingPage() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex flex-col font-sans">
            {/* Navbar */}
            <header className="w-full px-6 py-4 flex justify-between items-center bg-gray-900/50 backdrop-blur-md fixed top-0 z-50 border-b border-gray-800">
                <div className="text-2xl font-extrabold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent tracking-tight">
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

            {/* Hero Section */}
            <main className="flex-1 flex flex-col items-center justify-center text-center px-4 mt-20">
                <div className="max-w-3xl space-y-8 animate-fade-in-up">
                    <h1 className="text-5xl md:text-6xl font-extrabold text-white leading-tight tracking-tight">
                        Smart, Secure & Simple{" "}
                        <br className="hidden md:block" />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
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
                            className="w-full sm:w-auto px-8 py-4 text-lg font-semibold text-white bg-indigo-600 rounded-full hover:bg-indigo-500 transition-all shadow-lg hover:shadow-indigo-500/50 transform hover:-translate-y-1 animate-bounce duration-1000"
                        >
                            Get Started for Free
                        </button>
                        <button
                            onClick={() => navigate("/auth/login")}
                            className="w-full sm:w-auto px-8 py-4 text-lg font-semibold text-indigo-400 bg-gray-800 border border-indigo-500/30 rounded-full hover:bg-gray-700 hover:border-indigo-400 transition-all shadow-sm hover:shadow-md transform hover:-translate-y-1"
                        >
                            Go to Dashboard
                        </button>
                        <button
                            onClick={() => navigate("/contracts/new")}
                            className="w-full sm:w-auto px-8 py-4 text-lg font-semibold text-white bg-emerald-600 rounded-full hover:bg-emerald-500 transition-all shadow-lg hover:shadow-emerald-500/50 transform hover:-translate-y-1"
                        >
                            Try Contract Editor
                        </button>
                    </div>
                </div>

                {/* Feature highlights (simple animation boxes) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-24 max-w-5xl mx-auto px-6 pb-20">
                    {[
                        {
                            title: "Draft Instantly",
                            desc: "Use our smart templates to draft legally binding contracts in seconds.",
                        },
                        {
                            title: "Sign Securely",
                            desc: "Collect e-signatures and maintain an immutable audit trail for every document.",
                        },
                        {
                            title: "Manage Easily",
                            desc: "Keep all your agreements organized and secure in one unified dashboard.",
                        },
                    ].map((feature, i) => (
                        <div
                            key={i}
                            className="p-6 bg-gray-800/50 rounded-2xl shadow-sm border border-gray-700 hover:shadow-xl hover:shadow-indigo-500/20 transition-all duration-300 transform hover:-translate-y-2 group"
                        >
                            <div className="w-12 h-12 mb-4 rounded-full bg-indigo-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <div className="w-6 h-6 bg-indigo-400 rounded-full opacity-75"></div>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">
                                {feature.title}
                            </h3>
                            <p className="text-gray-400">{feature.desc}</p>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
}
