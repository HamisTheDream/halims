"use client";
import { useEffect, useRef } from "react";

export function useRevealOnScroll() {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add("visible");
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
        );

        // Observe initial .reveal elements
        const observeAll = () => {
            const reveals = el.querySelectorAll(".reveal:not(.visible)");
            reveals.forEach((r) => observer.observe(r));
        };
        observeAll();

        // Watch for dynamically added .reveal elements (async data from Supabase)
        const mutationObserver = new MutationObserver(() => {
            observeAll();
        });
        mutationObserver.observe(el, { childList: true, subtree: true });

        return () => {
            observer.disconnect();
            mutationObserver.disconnect();
        };
    }, []);

    return ref;
}
