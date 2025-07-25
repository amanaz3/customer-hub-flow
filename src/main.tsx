
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import SecurityHeaders from "./components/Security/SecurityHeaders";

createRoot(document.getElementById("root")!).render(
  <>
    <SecurityHeaders />
    <App />
  </>
);
