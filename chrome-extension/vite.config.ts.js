import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { crx } from "@crxjs/vite-plugin";

var manifest_default = {
  manifest_version: 3,
  name: "Stayzy AI",
  version: "1.0.0",
  description: "A chrome extension genrate AI suggestion for Hostaway",
  permissions: ["storage"],
  action: {
    default_popup: "index.html"
  },
  content_scripts: [
    {
      js: ["src/content.tsx"],
      matches: ["https://dashboard.hostaway.com/*"]
    }
  ],
  background: {
    service_worker: "src/background.js"
  }
};

import path from "path";
var vite_config_default = defineConfig({
  plugins: [react(), crx({ manifest: manifest_default })],
  resolve: {
    alias: {
      "@": path.resolve("/home/cgt/workspace/react-chrome", "./src")
    }
  }
});
export {
  vite_config_default as default
};
