"use client";

import {useEffect, useRef, useState} from "react";

export function useScrollReveal<T extends HTMLElement = HTMLDivElement>(trigger: "scroll" | "mount" = "scroll") {
  const ref = useRef<T>(null);
  const [entered, setEntered] = useState(false);
  const [ready, setReady] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const preference = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setReducedMotion(preference?.matches ?? false);
    updatePreference();
    preference?.addEventListener("change", updatePreference);
    setReady(true);

    const element = ref.current;
    let observer: IntersectionObserver | undefined;
    if (trigger === "mount" || !element || !window.IntersectionObserver) {
      setEntered(true);
    } else {
      observer = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) {
          setEntered(true);
          observer?.disconnect();
        }
      }, {threshold: 0.1, rootMargin: "0px 0px -22% 0px"});
      observer.observe(element);
    }

    return () => {
      observer?.disconnect();
      preference?.removeEventListener("change", updatePreference);
    };
  }, [trigger]);

  return {ref, entered, reducedMotion, hidden: ready && !entered && !reducedMotion};
}
