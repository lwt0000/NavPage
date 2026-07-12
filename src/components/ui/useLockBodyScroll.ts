"use client";

import { useEffect } from "react";

/**
 * Locks body scroll while `locked` is true so overlays don't let the page
 * shift underneath. Compensates for the vanished scrollbar with padding so
 * fixed/sticky elements don't jump horizontally.
 */
export function useLockBodyScroll(locked: boolean) {
  useEffect(() => {
    if (!locked) return;
    const { body } = document;
    const prevOverflow = body.style.overflow;
    const prevPadding = body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    body.style.overflow = "hidden";
    if (scrollbarWidth > 0) body.style.paddingRight = `${scrollbarWidth}px`;
    return () => {
      body.style.overflow = prevOverflow;
      body.style.paddingRight = prevPadding;
    };
  }, [locked]);
}
