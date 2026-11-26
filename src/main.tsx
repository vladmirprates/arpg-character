import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app/App";
import "./styles/global.css";
import "./styles/v2/index.css";
import { applyUiVersion } from "./styles/v2/uiVersion";

applyUiVersion();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
