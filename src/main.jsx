import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { registerSW } from "virtual:pwa-register";
import App from "./App.jsx";
import { StudentProvider } from "./context/StudentContext.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import "./index.css";

registerSW({ immediate: true });

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <StudentProvider>
          <App />
        </StudentProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
