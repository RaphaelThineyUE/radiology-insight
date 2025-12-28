import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { createLogger } from '@/lib/logger';

const log = createLogger('route');

export function useRouteMetrics() {
    const location = useLocation();

    useEffect(() => {
        const path = location.pathname + location.search + location.hash;
        const start = performance.now();
        // Mark start
        try { performance.mark(`route-start:${path}`); } catch { }
        // Measure next paint after route content commits
        const id = requestAnimationFrame(() => {
            const duration = performance.now() - start;
            log.info('Route render duration', { path, durationMs: Math.round(duration) });
            try {
                performance.mark(`route-end:${path}`);
                performance.measure(`route:${path}`);
            } catch { }
        });
        return () => cancelAnimationFrame(id);
    }, [location.pathname, location.search, location.hash]);
}
