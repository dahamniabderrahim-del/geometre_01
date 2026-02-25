import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { listActiveAdmins } from "@/lib/admin";

const recoverOAuthStateError = () => {
  if (window.location.pathname !== "/") return;

  const currentUrl = new URL(window.location.href);
  const errorCode = currentUrl.searchParams.get("error_code");
  if (errorCode !== "bad_oauth_state") return;

  const redirect = currentUrl.searchParams.get("redirect");
  const nextUrl = new URL("/connexion", window.location.origin);

  if (redirect && redirect.startsWith("/") && !redirect.startsWith("//")) {
    nextUrl.searchParams.set("redirect", redirect);
  }
  nextUrl.searchParams.set("oauth_error", "bad_oauth_state");

  window.location.replace(nextUrl.toString());
};

const restoreSpaRouteFromFallback = () => {
  if (window.location.pathname !== "/") return;

  const currentUrl = new URL(window.location.href);
  const fallbackRoute = currentUrl.searchParams.get("spa_redirect");

  if (!fallbackRoute) return;
  if (!fallbackRoute.startsWith("/") || fallbackRoute.startsWith("//")) return;

  window.history.replaceState(null, "", fallbackRoute);
};

recoverOAuthStateError();
restoreSpaRouteFromFallback();

void listActiveAdmins().catch(() => undefined);

createRoot(document.getElementById("root")!).render(<App />);
