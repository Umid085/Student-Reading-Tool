// Per-locale lazy loading. English is the always-loaded fallback (bundled
// with the initial app code) so t(key) never misses on first render. The
// active non-English locale is dynamic-imported once at boot and merged
// into STRINGS — the user briefly sees English on the first paint, then
// their locale fills in (typically <200ms).
//
// This means a Russian-speaking user no longer downloads the 70kB of
// Uzbek/Turkish/Arabic/German/Spanish/French translations they never read.

import en from "./en.js";

// STRINGS is the live translation map consumed by t() in
// student-reading-quest.jsx. Keys are merged: STRINGS[lang][key].
export const STRINGS = { en };

// Loaders for each non-English locale. Vite emits each as a separate
// chunk; we only fetch the one the user actually wants.
const LOADERS = {
  uz: () => import("./uz.js"),
  ru: () => import("./ru.js"),
  tr: () => import("./tr.js"),
  ar: () => import("./ar.js"),
  de: () => import("./de.js"),
  es: () => import("./es.js"),
  fr: () => import("./fr.js"),
};

// Promise cache so a re-load of the same locale doesn't refetch.
const cache = { en: Promise.resolve(en) };

// Loads a locale into STRINGS and returns the loaded module. Callers can
// await this to render their locale immediately; the t() function reads
// from STRINGS on every call, so any later render will see the values.
export function loadLocale(lang) {
  if (!lang || lang === "en") return cache.en;
  if (cache[lang]) return cache[lang];
  const loader = LOADERS[lang];
  if (!loader) return cache.en;
  cache[lang] = loader().then((mod) => {
    STRINGS[lang] = mod.default || mod;
    return STRINGS[lang];
  }).catch(() => {
    // Network failure: fall through to English. Don't poison the cache so
    // a retry on the next locale change can succeed.
    delete cache[lang];
    return en;
  });
  return cache[lang];
}
