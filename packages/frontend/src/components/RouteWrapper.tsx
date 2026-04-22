import { Suspense, ReactNode, useState, useEffect } from "react";

interface RouteWrapperProps {
    children: ReactNode;
    fallback?: ReactNode;
    delayInMilliSeconds?: number;
}

const DelayedFallback = ({
    fallback,
    delay,
}: {
    fallback: ReactNode;
    delay: number;
}) => {
    const [show, setShow] = useState(delay === 0);

    useEffect(() => {
        if (delay === 0) return;
        const timeout = setTimeout(() => setShow(true), delay);
        return () => clearTimeout(timeout);
    }, [delay]);

    return show ? <>{fallback}</> : null;
};

const RouteWrapper = ({
    children,
    fallback = null,
    delayInMilliSeconds = 1000,
}: RouteWrapperProps) => (
    <Suspense
        fallback={
            <DelayedFallback fallback={fallback} delay={delayInMilliSeconds} />
        }
    >
        {children}
    </Suspense>
);

export default RouteWrapper;
