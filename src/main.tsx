import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { listActiveAdmins } from "@/lib/admin";

const restoreSpaRouteFromFallback = () => {
  if (window.location.pathname !== "/") return;

  const currentUrl = new URL(window.location.href);
  const fallbackRoute = currentUrl.searchParams.get("spa_redirect");

  if (!fallbackRoute) return;
  if (!fallbackRoute.startsWith("/") || fallbackRoute.startsWith("//")) return;

  window.history.replaceState(null, "", fallbackRoute);
};

restoreSpaRouteFromFallback();

void listActiveAdmins().catch(() => undefined);

createRoot(document.getElementById("root")!).render(<App />);
