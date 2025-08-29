import { useEffect, useRef, useState } from 'react';


export function useContainerReady() {
const containerRef = useRef<HTMLDivElement>(null);
const [containerOk, setContainerOk] = useState(false);
useEffect(() => {
const el = containerRef.current; if (!el) return; const check = () => setContainerOk(el.offsetWidth > 0 && el.offsetHeight > 0);
check(); const ro = new ResizeObserver(check); ro.observe(el); return () => ro.disconnect();
}, []);
return { containerRef, containerOk } as const;
}