/** @type {import('tailwindcss').Config} */
export default {
    content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
    theme: {
        extend: {
            animation: {
                "float-slow": "float 6s ease-in-out infinite",
                "pulse-slow": "pulse 4s ease-in-out infinite",
                "fade-in-up": "fadeInUp 1s ease-out",
            },
            keyframes: {
                float: {
                    "0%, 100%": { transform: "translateY(0px)" },
                    "50%": { transform: "translateY(-20px)" },
                },
                pulse: {
                    "0%, 100%": { opacity: "0.3" },
                    "50%": { opacity: "1" },
                },
                fadeInUp: {
                    "0%": { opacity: "0", transform: "translateY(20px)" },
                    "100%": { opacity: "1", transform: "translateY(0)" },
                },
            },
            boxShadow: {
                "focus-brand":  "0 0 0 3px rgba(99, 102, 241, 0.35)",
                "focus-danger": "0 0 0 3px rgba(248, 113, 113, 0.35)",
                "card":         "0 1px 3px 0 rgba(0,0,0,0.4), 0 1px 2px -1px rgba(0,0,0,0.4)",
                "card-hover":   "0 4px 12px 0 rgba(0,0,0,0.5)",
                "modal":        "0 25px 50px -12px rgba(0,0,0,0.8)",
            },
        },
    },
    plugins: [],
};
