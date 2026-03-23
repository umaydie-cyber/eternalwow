import { useEffect, useState } from 'react';

export const MOBILE_BREAKPOINT = 768;

export const useIsMobile = (breakpoint = MOBILE_BREAKPOINT) => {
    const [isMobile, setIsMobile] = useState(() => {
        if (typeof window === 'undefined') return false;
        if (!window.matchMedia) return window.innerWidth <= breakpoint;
        return window.matchMedia(`(max-width: ${breakpoint}px)`).matches;
    });

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const mq = window.matchMedia ? window.matchMedia(`(max-width: ${breakpoint}px)`) : null;

        const update = () => {
            if (mq) setIsMobile(mq.matches);
            else setIsMobile(window.innerWidth <= breakpoint);
        };

        update();

        if (mq) {
            if (mq.addEventListener) mq.addEventListener('change', update);
            else mq.addListener(update);
            return () => {
                if (mq.removeEventListener) mq.removeEventListener('change', update);
                else mq.removeListener(update);
            };
        }

        window.addEventListener('resize', update);
        return () => window.removeEventListener('resize', update);
    }, [breakpoint]);

    return isMobile;
};

export const isTouchDevice = () => {
    if (typeof window === 'undefined') return false;
    return (
        'ontouchstart' in window ||
        (navigator && (navigator.maxTouchPoints || navigator.msMaxTouchPoints) > 0)
    );
};

export const safeAreaBottom = () => 'env(safe-area-inset-bottom, 0px)';
