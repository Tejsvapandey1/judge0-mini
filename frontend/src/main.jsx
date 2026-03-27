import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ClerkProvider } from "@clerk/clerk-react";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App.jsx";

const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      {clerkPublishableKey ? (
        <ClerkProvider publishableKey={clerkPublishableKey} afterSignOutUrl="/">
          <App authEnabled />
        </ClerkProvider>
      ) : (
        <App authEnabled={false} />
      )}
    </BrowserRouter>
  </StrictMode>,
);
