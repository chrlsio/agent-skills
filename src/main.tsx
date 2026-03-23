import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import { ToastProvider } from "./components/ToastProvider";
import "./i18n";
import "./index.css";

const queryClient = new QueryClient();

/* ── Global mouse tracker for liquid-glass highlight ── */
{
  const root = document.documentElement;
  let ticking = false;
  document.addEventListener("mousemove", (e) => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      root.style.setProperty("--mx", `${e.clientX}`);
      root.style.setProperty("--my", `${e.clientY}`);
      ticking = false;
    });
  });
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <App />
      </ToastProvider>
    </QueryClientProvider>
  </React.StrictMode>,
);
