declare global {
  interface Window {
    __googleMapsPlacesLoadingPromise?: Promise<void>;
    google?: any;
  }
}

const GOOGLE_MAPS_SCRIPT_ID = "google-maps-places-script";

export async function loadGoogleMapsPlacesApi() {
  if (typeof window === "undefined") return;

  if (window.google?.maps?.places) {
    return;
  }

  if (window.__googleMapsPlacesLoadingPromise) {
    return window.__googleMapsPlacesLoadingPromise;
  }

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("Cle Google Maps absente (VITE_GOOGLE_MAPS_API_KEY).");
  }

  window.__googleMapsPlacesLoadingPromise = new Promise<void>((resolve, reject) => {
    const existingScript = document.getElementById(GOOGLE_MAPS_SCRIPT_ID) as HTMLScriptElement | null;

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener("error", () => reject(new Error("Chargement Google Maps impossible.")), {
        once: true,
      });
      return;
    }

    const script = document.createElement("script");
    script.id = GOOGLE_MAPS_SCRIPT_ID;
    script.async = true;
    script.defer = true;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places&loading=async`;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Chargement Google Maps impossible."));
    document.head.appendChild(script);
  }).finally(() => {
    if (!window.google?.maps?.places) {
      window.__googleMapsPlacesLoadingPromise = undefined;
    }
  });

  return window.__googleMapsPlacesLoadingPromise;
}

