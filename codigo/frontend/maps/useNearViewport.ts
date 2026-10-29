'use client';
import { useEffect, useState, type RefObject } from 'react';

export interface NearViewport {
  /** El elemento ya llegó visualmente al viewport. Una vez true no vuelve a false. */
  near: boolean;
  /** false si el navegador no tiene IntersectionObserver: el mapa interactivo no se carga. */
  supported: boolean;
}

/**
 * Detecta cuándo el elemento llega visualmente al viewport con IntersectionObserver.
 * Sin IntersectionObserver NO se carga nada pesado: el llamante muestra el fallback estático.
 */
export function useNearViewport(ref: RefObject<Element | null>, enabled = true, rootMargin = '0px'): NearViewport {
  const [near, setNear] = useState(false);
  const [supported, setSupported] = useState(true);
  useEffect(() => {
    if (!enabled || near) return;
    if (typeof IntersectionObserver === 'undefined') { setSupported(false); return; }
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) { setNear(true); io.disconnect(); }
    }, { rootMargin });
    io.observe(el);
    return () => io.disconnect();
  }, [ref, enabled, near, rootMargin]);
  return { near, supported };
}
