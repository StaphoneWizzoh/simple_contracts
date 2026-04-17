import { Suspense, ReactNode } from "react";

interface RouteWrapperProps {
    children: ReactNode;
    fallback?: ReactNode;
}

/**
 * RouteWrapper component that wraps route elements with Suspense
 * Accepts an optional fallback component for route-specific loading states
 * Falls back to null if no fallback is provided
 */
const RouteWrapper = ({ children, fallback = null }: RouteWrapperProps) => (
    <Suspense fallback={fallback}>{children}</Suspense>
);

export default RouteWrapper;
