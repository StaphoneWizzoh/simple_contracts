import { useEffect, useRef, useState } from "react";

type Props = {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
};

export default function SearchBar({ value, onChange, placeholder = "Search contracts..." }: Props) {
    const [local, setLocal] = useState(value);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        setLocal(value);
    }, [value]);

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
        const v = e.target.value;
        setLocal(v);
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => onChange(v), 300);
    }

    return (
        <div className="relative flex-1 min-w-0">
            <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-500 pointer-events-none"
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
            </svg>
            <input
                type="text"
                value={local}
                onChange={handleChange}
                placeholder={placeholder}
                className="w-full rounded-lg border border-gray-700 bg-gray-900 pl-9 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            {local && (
                <button
                    onClick={() => { setLocal(""); onChange(""); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                    ✕
                </button>
            )}
        </div>
    );
}
