"use client";

import {useEffect, useRef, useState} from "react";

const pendingReveals = new Set<() => void>();
const bottomTolerance = 2;

function revealAtPageBottom() {
  const scrollHeight = (document.scrollingElement ?? document.documentElement).scrollHeight;
  if (scrollHeight <= 0 || window.scrollY + window.innerHeight < scrollHeight - bottomTolerance) return;

  for (const reveal of Array.from(pendingReveals)) reveal();
}

function subscribeToPageBottom(reveal: () => void) {
  pendingReveals.add(reveal);
  if (pendingReveals.size === 1) {
    window.addEventListener("scroll", revealAtPageBottom, {passive: true});
    window.addEventListener("resize", revealAtPageBottom);
  }

  return () => {
    pendingReveals.delete(reveal);
    if (pendingReveals.size === 0) {
      window.removeEventListener("scroll", revealAtPageBottom);
      window.removeEventListener("resize", revealAtPageBottom);
    }
  };
}

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
    let unsubscribeFromPageBottom = () => {};
    const reveal = () => {
      setEntered(true);
      observer?.disconnect();
      unsubscribeFromPageBottom();
    };

    if (trigger === "mount" || !element || !window.IntersectionObserver) {
      reveal();
    } else {
      observer = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) reveal();
      }, {threshold: 0.1, rootMargin: "0px 0px -22% 0px"});
      observer.observe(element);
      unsubscribeFromPageBottom = subscribeToPageBottom(reveal);
      revealAtPageBottom();
    }

    return () => {
      observer?.disconnect();
      unsubscribeFromPageBottom();
      preference?.removeEventListener("change", updatePreference);
    };
  }, [trigger]);

  return {ref, entered, reducedMotion, hidden: ready && !entered && !reducedMotion};
}
