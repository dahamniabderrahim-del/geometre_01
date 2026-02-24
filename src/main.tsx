import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { listActiveAdmins } from "@/lib/admin";

void listActiveAdmins().catch(() => undefined);

createRoot(document.getElementById("root")!).render(<App />);
