import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "url";
import { dirname } from "path";

// https://vite.dev/config/
export default defineConfig({
  base: "/EMI-GST-CALCULATOR-FOR-KSDC/",
  plugins: [react()],
  resolve: {
    alias: {
      "@": dirname(fileURLToPath(import.meta.url)) + "/src",
    },
  },
  server: {
    host: '0.0.0.0', // Expose to local network
  },
});
