import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Toaster } from "sonner";
import App from "./App";
import "./index.css";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import store,  { persistor }  from "./store";
import { PersistGate } from "redux-persist/integration/react";

const rootElement = document.getElementById("root");
if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <BrowserRouter>
        <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          <Toaster richColors closeButton />
          <App />
          </PersistGate>
        </Provider>
      </BrowserRouter>
    </StrictMode>
  );
}
