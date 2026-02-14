"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    Lenis?: new (options?: Record<string, unknown>) => {
      raf: (time: number) => void;
      destroy: () => void;
    };
  }
}

const LENIS_SCRIPT_ID = "lenis-cdn-script";
const LENIS_CDN_URL =
  "https://cdn.jsdelivr.net/npm/lenis@1.3.13/dist/lenis.min.js";

const LenisScroll = () => {
  useEffect(() => {
    let frameId = 0;
    let lenisInstance:
      | {
          raf: (time: number) => void;
          destroy: () => void;
        }
      | null = null;

    const startLenis = () => {
      if (!window.Lenis || lenisInstance) {
        return;
      }

      lenisInstance = new window.Lenis({
        autoRaf: false,
        smoothWheel: true,
        duration: 1.1,
        wheelMultiplier: 0.9,
      });

      const raf = (time: number) => {
        lenisInstance?.raf(time);
        frameId = window.requestAnimationFrame(raf);
      };

      frameId = window.requestAnimationFrame(raf);
    };

    const script = document.getElementById(
      LENIS_SCRIPT_ID
    ) as HTMLScriptElement | null;

    if (script?.dataset.loaded === "true") {
      startLenis();
    } else {
      const scriptEl = script ?? document.createElement("script");
      scriptEl.id = LENIS_SCRIPT_ID;
      scriptEl.src = LENIS_CDN_URL;
      scriptEl.async = true;

      const onLoad = () => {
        scriptEl.dataset.loaded = "true";
        startLenis();
      };

      scriptEl.addEventListener("load", onLoad);

      if (!script) {
        document.head.appendChild(scriptEl);
      }

      return () => {
        scriptEl.removeEventListener("load", onLoad);
        window.cancelAnimationFrame(frameId);
        lenisInstance?.destroy();
      };
    }

    return () => {
      window.cancelAnimationFrame(frameId);
      lenisInstance?.destroy();
    };
  }, []);

  return null;
};

export default LenisScroll;
